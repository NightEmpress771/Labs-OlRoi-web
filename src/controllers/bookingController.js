import { prisma } from '../db.js';

export async function getBookings(req, res) {
  const isAdmin = req.user.role === 'ADMIN';
  const where = isAdmin ? {} : { userId: req.user.userId };

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      vehicle: true,
    },
    orderBy: { startTime: 'desc' },
  });

  res.json({ data: bookings });
}

export async function createBooking(req, res) {
  const vehicleId = Number(req.body.vehicleId);
  const hours = Math.max(Number(req.body.hours) || 1, 1);

  const [vehicle, user] = await Promise.all([
    prisma.vehicle.findUnique({ where: { id: vehicleId } }),
    prisma.user.findUnique({ where: { id: req.user.userId } }),
  ]);

  if (!vehicle) return res.status(404).json({ error: 'Транспорт не знайдено' });
  if (!user) return res.status(404).json({ error: 'Користувача не знайдено' });

  if (vehicle.status !== 'AVAILABLE') {
    return res.status(400).json({ error: 'Цей транспорт зараз недоступний для оренди' });
  }

  const totalPrice = vehicle.pricePerHour * hours;

  if (user.balance < totalPrice) {
    return res.status(400).json({
      error: `Недостатньо коштів на балансі. Потрібно ${totalPrice} грн, на рахунку ${user.balance} грн.`,
      code: 'INSUFFICIENT_FUNDS',
      balance: user.balance,
      required: totalPrice,
    });
  }

  const [booking, updatedUser] = await prisma.$transaction([
    prisma.booking.create({
      data: {
        userId: req.user.userId,
        vehicleId,
        hours,
        totalPrice,
        status: 'ACTIVE',
      },
      include: { vehicle: true },
    }),
    prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: 'IN_USE' },
    }),
    prisma.user.update({
      where: { id: req.user.userId },
      data: { balance: { decrement: totalPrice } },
    }),
  ]);

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${req.user.userId}`).emit('notification', {
      type: 'success',
      title: 'Оренду оформлено!',
      message: `Ви орендували ${vehicle.model} на ${hours} год. (${totalPrice} грн)`,
    });
    io.emit('vehicles:changed');
    io.emit('bookings:changed');
  }

  res.status(201).json({
    ...booking,
    updatedBalance: updatedUser.balance,
  });
}

export async function completeBooking(req, res) {
  const id = Number(req.params.id);
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { vehicle: true },
  });

  if (!booking) return res.status(404).json({ error: 'Бронювання не знайдено' });
  if (booking.userId !== req.user.userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Недостатньо прав' });
  }
  if (booking.status !== 'ACTIVE') {
    return res.status(400).json({ error: 'Ця поїздка вже завершена' });
  }

  const [updatedBooking] = await prisma.$transaction([
    prisma.booking.update({
      where: { id },
      data: { status: 'COMPLETED', endTime: new Date() },
    }),
    prisma.vehicle.update({
      where: { id: booking.vehicleId },
      data: { status: 'AVAILABLE' },
    }),
  ]);

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${booking.userId}`).emit('notification', {
      type: 'info',
      title: 'Поїздку завершено',
      message: `Оренду ${booking.vehicle.model} успішно закрито.`,
    });
    io.emit('vehicles:changed');
    io.emit('bookings:changed');
  }

  res.json(updatedBooking);
}