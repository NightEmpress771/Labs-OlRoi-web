import { Router } from 'express';
import { getBookings, createBooking, completeBooking } from '../controllers/bookingController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getBookings);
router.post('/', createBooking);
router.patch('/:id/complete', completeBooking);

export default router;