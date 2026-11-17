import { createServer } from 'node:http';
import app from './app.js';
import { initSocket } from './socket/index.js';

const PORT = process.env.PORT || 3000;

// Створюємо HTTP сервер на основі нашого Express додатку
const httpServer = createServer(app);

// Ініціалізуємо WebSocket та зберігаємо об'єкт io у глобальних налаштуваннях app
// Це дозволить нам надсилати сповіщення з будь-якого контролера
app.set('io', initSocket(httpServer));

// Важливо: запускаємо саме httpServer, а не app
httpServer.listen(PORT, () => {
  console.log(`Сервер успішно запущено на порту ${PORT}`);
  console.log(`Документація API доступна тут: http://localhost:${PORT}/api-docs`);
});