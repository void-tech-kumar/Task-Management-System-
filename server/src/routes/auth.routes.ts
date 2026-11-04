import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  studentSignupInit,
  studentSignupVerify,
  loginOtpInit,
  loginOtpVerify,
  resendOtp,
  getSmtpStatus,
} from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  loginSchema,
  registerSchema,
  signupInitSchema,
  signupVerifySchema,
  loginOtpInitSchema,
  loginOtpVerifySchema,
  resendOtpSchema,
} from '../validations/auth.validation.js';

const router = Router();

// Standard Login & Registration
router.post('/login', validate(loginSchema), login);
router.post('/register', validate(registerSchema), register);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

// SMTP OTP Student Registration Flow
router.post('/signup/init', validate(signupInitSchema), studentSignupInit);
router.post('/signup/verify', validate(signupVerifySchema), studentSignupVerify);

// SMTP OTP Login Flow
router.post('/login/otp/init', validate(loginOtpInitSchema), loginOtpInit);
router.post('/login/otp/verify', validate(loginOtpVerifySchema), loginOtpVerify);

// Resend OTP
router.post('/otp/resend', validate(resendOtpSchema), resendOtp);

// SMTP Status / Verification
router.get('/smtp-status', getSmtpStatus);

export default router;
