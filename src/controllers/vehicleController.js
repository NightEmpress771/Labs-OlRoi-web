import { prisma } from '../db.js';
import Joi from 'joi';

const vehicleSchema = Joi.object({
  type: Joi.string().valid('BIKE', 'SCOOTER').required(),
  model: Joi.string().min(2).required(),
  status: Joi.string().valid('AVAILABLE', 'IN_USE', 'MAINTENANCE')
});

export async function getAllVehicles(req, res) {
  const { page = 1, limit = 10, search, type } = req.query;
  const skip = (Math.max(Number(page), 1) - 1) * Math.max(Number(limit), 1);
  
  const where = {};
  if (search) where.model = { contains: search, mode: 'insensitive' };
  if (type) where.type = type;

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({ where, skip, take: Number(limit) }),
    prisma.vehicle.count({ where })
  ]);

  res.json({ data: vehicles, total, page: Number(page) });
}

export async function createVehicle(req, res) {
  const { error, value } = vehicleSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const newVehicle = await prisma.vehicle.create({ data: value });
  
  // РЕАЛЬНИЙ ЧАС: Надсилаємо подію всім клієнтам (broadcast)
  req.app.get('io').emit('vehicle:created', newVehicle);
  
  res.status(201).json(newVehicle);
}