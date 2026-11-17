import { prisma } from '../db.js';
import * as argon2 from 'argon2';

export async function getAllUsers(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const skip = (page - 1) * limit;

  // Пошук за іменем або email
  const where = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ]
  } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take: limit, orderBy: { id: 'desc' } }),
    prisma.user.count({ where })
  ]);

  res.json({
    data: users,
    pagination: { 
      page, 
      limit, 
      total, 
      totalPages: Math.ceil(total / limit) || 1, 
      hasMore: skip + users.length < total 
    }
  });
}

export async function getUserById(req, res) {
  const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
  if (!user) return res.status(404).json({ error: 'Користувача не знайдено' });
  res.json(user);
}

export async function createUser(req, res) {
  const { name, email } = req.body;
  
  // Генеруємо стандартний пароль для користувача, якого створює адмін
  const hashedPassword = await argon2.hash('password123');
  
  try {
    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: 'USER' }
    });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: 'Помилка створення (можливо, email вже існує)' });
  }
}

export async function updateUser(req, res) {
  const { name, email } = req.body;
  const updated = await prisma.user.update({
    where: { id: Number(req.params.id) },
    data: { name, email }
  });
  res.json(updated);
}

export async function deleteUser(req, res) {
  await prisma.user.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: 'Видалено' });
}