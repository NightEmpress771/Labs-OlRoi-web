import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/db.js';

const user = { email: 'test@example.com', password: 'testpassword123', name: 'Test User' };

describe('Authentication API', () => {
  before(async () => {
    await prisma.user.deleteMany({ where: { email: user.email } });
  });
  
  after(async () => {
    await prisma.user.deleteMany({ where: { email: user.email } });
    await prisma.$disconnect();
  });

  test('реєструє нового користувача', async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    assert.equal(res.status, 201);
    assert.equal(res.body.user.email, user.email);
    assert.ok(res.body.tokens.accessToken);
  });

  test('не реєструє користувача з існуючим email', async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    assert.equal(res.status, 409);
  });

  test('входить із правильними даними', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
    assert.equal(res.status, 200);
    assert.ok(res.body.tokens.accessToken);
  });

  test('refresh: ротація токена та відкликання старого', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
    const { refreshToken } = login.body.tokens;

    const first = await request(app).post('/api/auth/refresh').send({ refreshToken });
    assert.equal(first.status, 200);
    
    const reuse = await request(app).post('/api/auth/refresh').send({ refreshToken });
    assert.equal(reuse.status, 401);
  });
});