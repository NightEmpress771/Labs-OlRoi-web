import { Router } from 'express';
import {
  register,
  login,
  getMe,
  topUpBalance,
  refresh,
  logout,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Реєстрація нового користувача
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               name: { type: string }
 *     responses:
 *       201: { description: Користувач успішно зареєстрований }
 *       400: { description: Помилка валідації даних }
 *       409: { description: Користувач вже існує }
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вхід користувача
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Успішний вхід }
 *       401: { description: Невірні дані для входу }
 */
router.post('/login', login);

router.get('/me', authenticate, getMe);
router.post('/balance/topup', authenticate, topUpBalance);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Оновлення пари токенів
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: Токени успішно оновлено }
 *       401: { description: Недійсний або відкликаний refresh токен }
 */
router.post('/refresh', refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Вихід (відкликання refresh токена)
 *     tags: [Authentication]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       204: { description: Токен відкликано }
 */
router.post('/logout', logout);

export default router;