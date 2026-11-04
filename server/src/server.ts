import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { prisma } from './config/db.js';

const app = express();

// Security and utility middleware
const allowedOrigins = [
  ENV.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., same-origin, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        Boolean(process.env.VERCEL)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get(['/health', '/api/health'], (_req, res) => {
  const dbConfigured = Boolean(process.env.DATABASE_URL || ENV.DATABASE_URL);
  res.status(200).json({
    status: 'ok',
    databaseConfigured: dbConfigured,
    message: dbConfigured
      ? 'TaskFlow API and Database connection configured.'
      : 'DATABASE_URL is missing in environment variables. Configure it in Vercel Project Settings.',
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use('/api/v1', routes);
app.use('/api', routes);
app.use('/v1', routes);
app.use('/', routes);

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

if (!process.env.VERCEL) {
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
}

export default app;

