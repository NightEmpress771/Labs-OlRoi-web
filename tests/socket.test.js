import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { io as connect } from 'socket.io-client';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/db.js';
import { initSocket } from '../src/socket/index.js';
import { generateAccessToken } from '../src/utils/jwt.js';

describe('WebSocket & Notifications API', () => {
  let httpServer;
  let client;
  let token;
  let user;

  before(async () => {
    // Підготовка БД і запуск тестового сервера
    await prisma.user.deleteMany({ where: { email: 'ws@example.com' } });
    user = await prisma.user.create({
      data: { email: 'ws@example.com', password: 'hash', name: 'WS Tester', role: 'ADMIN' }
    });
    token = generateAccessToken(user.id, user.role);

    httpServer = createServer(app);
    app.set('io', initSocket(httpServer));
    await new Promise((res) => httpServer.listen(0, res));
  });

  after(async () => {
    if (client) client.close();
    httpServer.close();
    await prisma.user.deleteMany({ where: { email: 'ws@example.com' } });
    await prisma.$disconnect();
  });

  test('підключення без токена відхиляється', async () => {
    const badClient = connect(`http://localhost:${httpServer.address().port}`, { auth: {} });
    const [error] = await once(badClient, 'connect_error');
    assert.equal(error.message, 'unauthorized');
    badClient.close();
  });

  test('отримання події в реальному часі при створенні транспорту', async () => {
    // Підключаємося як авторизований клієнт
    client = connect(`http://localhost:${httpServer.address().port}`, { auth: { token } });
    await once(client, 'connect');

    // Починаємо "слухати" подію
    const eventPromise = once(client, 'vehicle:created');

    // Імітуємо HTTP-запит на створення самоката
    const res = await request(httpServer)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'SCOOTER', model: 'Realtime Scooter' });

    assert.equal(res.status, 201);
    
    // Чекаємо, чи прилетить нам WebSocket-повідомлення
    const [payload] = await eventPromise;
    assert.equal(payload.model, 'Realtime Scooter');
  });
});