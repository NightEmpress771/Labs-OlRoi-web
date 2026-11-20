import { Router } from 'express';
import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../controllers/vehicleController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllVehicles);
router.get('/:id', getVehicleById);
router.post('/', authenticate, authorize('ADMIN'), createVehicle);
router.put('/:id', authenticate, authorize('ADMIN'), updateVehicle);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteVehicle);

export default router;