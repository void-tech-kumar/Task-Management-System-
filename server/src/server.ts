import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { prisma } from './config/db.js';

const app = express();

// Security and utility middleware
app.use(
  cors({
    origin: [ENV.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount API routes
app.use('/api/v1', routes);
app.use('/api', routes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = ENV.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 TaskFlow Backend running on port ${PORT} [${ENV.NODE_ENV}]`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api/v1`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Stopping TaskFlow server...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server stopped cleanly.');
    process.exit(0);
  });
});

export default app;

