import { prisma } from '../db.js';
import Joi from 'joi';

const vehicleSchema = Joi.object({
  type: Joi.string().valid('BIKE', 'SCOOTER').required(),
  model: Joi.string().min(2).required(),
  description: Joi.string().allow('', null).optional(),
  pricePerHour: Joi.number().positive().default(50),
  imageUrl: Joi.string().uri().allow('', null).optional(),
  status: Joi.string().valid('AVAILABLE', 'IN_USE', 'MAINTENANCE').default('AVAILABLE'),
});

export async function getAllVehicles(req, res) {
  const { page = 1, limit = 12, search, type, status } = req.query;
  const pageNumber = Math.max(Number(page) || 1, 1);
  const take = Math.min(Math.max(Number(limit) || 12, 1), 100);
  const skip = (pageNumber - 1) * take;

  const where = {};
  if (search) {
    where.OR = [
      { model: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (type && type !== 'ALL') where.type = type;
  if (status && status !== 'ALL') where.status = status;

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({ where, skip, take, orderBy: { id: 'desc' } }),
    prisma.vehicle.count({ where }),
  ]);

  res.json({
    data: vehicles,
    pagination: {
      page: pageNumber,
      limit: take,
      total,
      totalPages: Math.ceil(total / take) || 1,
      hasMore: skip + vehicles.length < total,
    },
  });
}

export async function getVehicleById(req, res) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: Number(req.params.id) },
    include: { reviews: { include: { user: { select: { id: true, name: true } } } } },
  });
  if (!vehicle) return res.status(404).json({ error: 'Транспортний засіб не знайдено' });
  res.json(vehicle);
}

export async function createVehicle(req, res) {
  const { error, value } = vehicleSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const newVehicle = await prisma.vehicle.create({ data: value });
  req.app.get('io')?.emit('vehicles:changed', newVehicle);
  res.status(201).json(newVehicle);
}

export async function updateVehicle(req, res) {
  const id = Number(req.params.id);
  const existing = await prisma.vehicle.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Транспортний засіб не знайдено' });

  const { error, value } = vehicleSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const updated = await prisma.vehicle.update({ where: { id }, data: value });
  req.app.get('io')?.emit('vehicles:changed', updated);
  res.json(updated);
}

export async function deleteVehicle(req, res) {
  const id = Number(req.params.id);
  await prisma.vehicle.delete({ where: { id } });
  req.app.get('io')?.emit('vehicles:changed', { id, deleted: true });
  res.json({ message: 'Транспорт видалено' });
}