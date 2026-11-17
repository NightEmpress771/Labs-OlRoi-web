import { prisma } from '../db.js';

// Утиліта для збереження і миттєвої відправки сповіщення
export async function sendNotification(req, userId, message) {
  const notification = await prisma.notification.create({
    data: { message, userId }
  });
  
  // Надсилаємо наживо в персональну кімнату користувача
  req.app.get('io').to(`user:${userId}`).emit('notification', notification);
  return notification;
}

// Отримання списку сповіщень користувача
export async function getMyNotifications(req, res) {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  res.json(notifications);
}

// Позначення сповіщення як прочитаного
export async function markAsRead(req, res) {
  const { id } = req.params;
  await prisma.notification.updateMany({
    where: { id: Number(id), userId: req.user.userId },
    data: { isRead: true }
  });
  res.json({ message: 'Сповіщення прочитано' });
}