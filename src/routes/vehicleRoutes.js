import { Router } from 'express';
import { getAllVehicles, createVehicle } from '../controllers/vehicleController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.get('/', getAllVehicles);
router.post('/', authenticate, authorize('ADMIN'), createVehicle);

export default router;