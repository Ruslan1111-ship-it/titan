import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import clientsRoutes from './routes/clients.js';
import analyticsRoutes from './routes/analytics.js';
import membershipsRoutes from './routes/memberships.js';
import scheduleRoutes from './routes/schedule.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

console.log('🔧 Инициализация сервера...');
console.log('📍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔌 PORT:', PORT);

// Middleware
app.use(cors());
app.use(express.json());

// Health check (должен быть первым)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Сервер работает', env: process.env.NODE_ENV });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/memberships', membershipsRoutes);
app.use('/api/schedule', scheduleRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  console.log('📁 Serving static files from:', distPath);
  app.use(express.static(distPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📊 Режим: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 API доступен по адресу: http://localhost:${PORT}/api`);
  console.log(`✅ Сервер готов к работе!`);
});
