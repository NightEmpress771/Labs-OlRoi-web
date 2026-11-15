const prisma = require('../utils/prisma');
const Joi = require('joi');

const vehicleSchema = Joi.object({
  type: Joi.string().valid('BIKE', 'SCOOTER').required(),
  model: Joi.string().min(2).required(),
  status: Joi.string().valid('AVAILABLE', 'IN_USE', 'MAINTENANCE')
});

exports.getAllVehicles = async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany();
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: 'Помилка отримання даних' });
  }
};

exports.createVehicle = async (req, res) => {
  try {
    const { error, value } = vehicleSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const newVehicle = await prisma.vehicle.create({ data: value });
    res.status(201).json(newVehicle);
  } catch (error) {
    res.status(500).json({ error: 'Помилка створення транспорту' });
  }
};