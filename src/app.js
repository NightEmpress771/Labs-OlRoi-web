import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpecs } from './config/swagger.js';
import authRoutes from './routes/authRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';

const app = express();

// Базовий захист HTTP-заголовків
app.use(helmet());

// Дозвіл запитів з фронтенду
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Захист від DDoS (максимум 100 запитів за 15 хвилин з однієї IP)
app.use(
  '/api/',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Забагато запитів з цієї IP-адреси, спробуйте пізніше' },
  })
);

// Парсинг JSON
app.use(express.json());

// Підключення документації Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, { explorer: true }));

// Підключення всіх маршрутів
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/vehicles', vehicleRoutes);

// Глобальний обробник помилок (включаючи помилки Multer)
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    const error = err.code === 'LIMIT_FILE_SIZE' ? 'Файл занадто великий' : 'Помилка завантаження файлу';
    return res.status(400).json({ error });
  }

  const status = err.status || 500;
  if (status >= 500) console.error(err);

  res.status(status).json({ error: status >= 500 ? 'Внутрішня помилка сервера' : err.message });
});

export default app;