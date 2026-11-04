import dotenv from 'dotenv';
import path from 'path';

// Load from server/.env or root .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  DIRECT_URL: process.env.DIRECT_URL || process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'taskflow_academic_super_secret_jwt_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

  // SMTP Email
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'TaskFlow Academic Portal <noreply@taskflow.edu>',

  // OTP HMAC Hashing Secret
  OTP_SECRET: process.env.OTP_SECRET || process.env.JWT_SECRET || 'taskflow_otp_hmac_secret_2026',

  // S3-Compatible Object Storage
  AWS_ENDPOINT_URL_S3: process.env.AWS_ENDPOINT_URL_S3 || '',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
};
