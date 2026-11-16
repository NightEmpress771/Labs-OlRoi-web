import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Сервер успішно запущено на порту ${PORT}`);
  console.log(`Документація API доступна тут: http://localhost:${PORT}/api-docs`);
});