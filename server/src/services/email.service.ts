import nodemailer, { Transporter } from 'nodemailer';
import { ENV } from '../config/env.js';

class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter(): void {
    if (ENV.SMTP_HOST && ENV.SMTP_USER && ENV.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: ENV.SMTP_HOST,
        port: ENV.SMTP_PORT,
        secure: ENV.SMTP_SECURE, // true for 465, false for 587
        auth: {
          user: ENV.SMTP_USER,
          pass: ENV.SMTP_PASS,
        },
      });
    } else {
      this.transporter = null;
    }
  }

  public isConfigured(): boolean {
    return Boolean(ENV.SMTP_HOST && ENV.SMTP_USER && ENV.SMTP_PASS);
  }

  public async verifyConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured() || !this.transporter) {
      return {
        success: false,
        message: 'SMTP is not configured. Missing SMTP_HOST, SMTP_USER, or SMTP_PASS.',
      };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'SMTP connection verified successfully.' };
    } catch (error: any) {
      return {
        success: false,
        message: `SMTP verification failed: ${error.message}`,
      };
    }
  }

  public async sendOtpEmail(
    toEmail: string,
    otp: string,
    purpose: 'STUDENT_SIGNUP' | 'LOGIN' | 'PASSWORD_RESET'
  ): Promise<{ sent: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured() || !this.transporter) {
      console.warn(
        `[EmailService: BLOCKED] Cannot send OTP email to ${toEmail}: SMTP credentials not configured in environment.`
      );
      return {
        sent: false,
        error: 'SMTP credentials not configured. Email delivery is BLOCKED until SMTP is set up in Vercel/server.',
      };
    }

    const title =
      purpose === 'STUDENT_SIGNUP'
        ? 'Verify Your Student Account'
        : purpose === 'LOGIN'
        ? 'Login Verification Code'
        : 'Password Reset Code';

    const actionText =
      purpose === 'STUDENT_SIGNUP'
        ? 'complete your TaskFlow student registration'
        : purpose === 'LOGIN'
        ? 'sign in to your TaskFlow portal'
        : 'reset your account password';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table width="100%" max-width="520" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #4f46e5; padding: 32px 24px; text-align: center;">
              <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background: rgba(255, 255, 255, 0.2); border-radius: 12px; color: #ffffff; font-weight: bold; font-size: 20px; margin-bottom: 8px;">TF</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">TaskFlow Academic Portal</h1>
              <p style="color: #e0e7ff; margin: 4px 0 0; font-size: 13px;">Secure Academic Task Management</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="color: #0f172a; margin: 0 0 12px; font-size: 18px; font-weight: 600;">${title}</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                Use the one-time verification code below to ${actionText}. This code will expire in <strong>5 minutes</strong>.
              </p>
              
              <!-- OTP Box -->
              <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4338ca;">${otp}</span>
              </div>

              <!-- Security Notice -->
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px; padding: 12px 16px; margin-bottom: 24px;">
                <p style="color: #991b1b; font-size: 12px; line-height: 1.5; margin: 0;">
                  <strong>Security Notice:</strong> Never share this code with anyone. TaskFlow staff will never ask for your verification code. If you did not request this, please ignore this email.
                </p>
              </div>

              <p style="color: #64748b; font-size: 12px; margin: 0;">
                Valid for a single use within 5 minutes. Maximum 5 verification attempts allowed.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 28px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                © ${new Date().getFullYear()} TaskFlow Academic Portal. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    try {
      const info = await this.transporter.sendMail({
        from: ENV.SMTP_FROM,
        to: toEmail,
        subject: `[TaskFlow] ${title}: ${otp}`,
        text: `Your TaskFlow verification code is ${otp}. Valid for 5 minutes.`,
        html,
      });

      return { sent: true, messageId: info.messageId };
    } catch (error: any) {
      console.error(`[EmailService Error] Failed sending OTP to ${toEmail}:`, error.message);
      return { sent: false, error: error.message };
    }
  }
}

export const emailService = new EmailService();
