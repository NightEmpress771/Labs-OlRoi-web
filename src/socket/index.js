import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Перевірка токена при підключенні WebSocket
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) throw new Error('Токен відсутній');
      socket.user = verifyAccessToken(token);
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    // Користувач автоматично підключається до своєї приватної кімнати
    socket.join(`user:${socket.user.userId}`);

    socket.on('room:join', (room, ack) => {
      socket.join(room);
      if (ack) ack({ ok: true });
    });

    socket.on('room:leave', (room) => {
      socket.leave(room);
    });
  });

  return io;
}