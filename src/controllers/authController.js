import { createHash } from 'node:crypto';
import { prisma } from '../db.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

async function issueTokens(user) {
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);
  const { exp } = verifyRefreshToken(refreshToken);

  await prisma.refreshToken.create({
    data: {
      tokenHash: sha256(refreshToken),
      userId: user.id,
      expiresAt: new Date(exp * 1000),
    },
  });

  return { accessToken, refreshToken };
}

export async function register(req, res) {
  const { email, password, name } = req.body ?? {};

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Email, пароль та ім'я є обов'язковими" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Пароль має містити мінімум 8 символів' });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return res.status(409).json({ error: 'Користувач з таким email вже існує' });
  }

  const user = await prisma.user.create({
    data: { email, password: await hashPassword(password), name },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  res.status(201).json({
    message: 'Користувача успішно зареєстровано',
    user,
    tokens: await issueTokens(user),
  });
}

export async function login(req, res) {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email та пароль є обов'язковими" });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await comparePassword(password, user.password))) {
    return res.status(401).json({ error: 'Невірний email або пароль' });
  }

  const { password: _password, ...userWithoutPassword } = user;

  res.json({
    message: 'Успішний вхід',
    user: userWithoutPassword,
    tokens: await issueTokens(user),
  });
}

export async function refresh(req, res) {
  const { refreshToken } = req.body ?? {};

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh токен відсутній' });
  }

  try {
    verifyRefreshToken(refreshToken);
  } catch {
    return res.status(401).json({ error: 'Недійсний refresh токен' });
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: sha256(refreshToken) },
    include: { user: true },
  });

  if (!stored || stored.revokedAt) {
    if (stored) {
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return res.status(401).json({ error: 'Недійсний refresh токен' });
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  res.json({ tokens: await issueTokens(stored.user) });
}

export async function logout(req, res) {
  const { refreshToken } = req.body ?? {};

  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  res.status(204).end();
}