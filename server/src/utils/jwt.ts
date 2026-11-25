import jwt, { SignOptions } from 'jsonwebtoken';
import { Response } from 'express';
import { Role } from '@prisma/client';
import { ENV } from '../config/env.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  fullName: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || ENV.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables.');
  }
  return secret;
}

export const signToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: (ENV.JWT_EXPIRES_IN as any) || '7d',
  };
  return jwt.sign(payload, getJwtSecret(), options);
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, getJwtSecret()) as TokenPayload;
};

export const setAuthCookie = (res: Response, token: string): void => {
  const isProduction = ENV.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
};

export const clearAuthCookie = (res: Response): void => {
  const isProduction = ENV.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  res.cookie('token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  });
};

