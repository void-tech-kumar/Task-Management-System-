import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';
import { ENV } from '../config/env.js';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors;

  // Handle Prisma unique constraint violation (P2002)
  if (err.code === 'P2002') {
    statusCode = 409;
    const targets = Array.isArray(err.meta?.target)
      ? err.meta.target.join(', ')
      : err.meta?.target || 'field';
    message = `Duplicate entry: A record with this ${targets} already exists.`;
  }

  // Handle Prisma record not found (P2025)
  if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Requested resource not found.';
  }

  // Handle JWT expired/invalid
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please log in again.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(ENV.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

