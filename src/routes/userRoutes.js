import { Router } from 'express';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Всі роути вимагають авторизації
router.use(authenticate);

router.get('/', getAllUsers);
router.get('/:id', getUserById);

// Створювати, редагувати та видаляти може тільки адмін
router.post('/', authorize('ADMIN'), createUser);
router.put('/:id', authorize('ADMIN'), updateUser);
router.delete('/:id', authorize('ADMIN'), deleteUser);

export default router;