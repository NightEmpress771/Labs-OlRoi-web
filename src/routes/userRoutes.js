import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserRole,
  deleteUser,
} from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getAllUsers);
router.get('/:id', getUserById);

router.post('/', authorize('ADMIN'), createUser);
router.put('/:id', authorize('ADMIN'), updateUser);
router.patch('/:id/role', authorize('ADMIN'), updateUserRole);
router.delete('/:id', authorize('ADMIN'), deleteUser);

export default router;