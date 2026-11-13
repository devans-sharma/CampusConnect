import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    if (config.smtp.host && config.smtp.user && config.smtp.password) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.password,
        },
      });
      this.isConfigured = true;
      console.log('[EmailService] SMTP configured with host:', config.smtp.host);
    } else {
      console.log('[EmailService] SMTP not configured. External email delivery will be skipped (in-app notifications will function normally).');
    }
  }

  async sendEmail(to: string, subject: string, htmlContent: string): Promise<{ sent: boolean; status: string; reason?: string }> {
    if (!this.isConfigured || !this.transporter) {
      console.info(`[EmailService] Skipped external email to ${to}: SMTP not configured. Subject: "${subject}"`);
      return {
        sent: false,
        status: 'SKIPPED_UNCONFIGURED_SMTP',
        reason: 'SMTP credentials not configured in environment. In-app notification preserved.'
      };
    }

    try {
      const info = await this.transporter.sendMail({
        from: config.smtp.from,
        to,
        subject,
        html: htmlContent,
      });
      console.log(`[EmailService] Email sent successfully to ${to}. MessageId: ${info.messageId}`);
      return {
        sent: true,
        status: 'DELIVERED',
      };
    } catch (error: any) {
      console.error(`[EmailService] Failed to deliver email to ${to}:`, error.message);
      return {
        sent: false,
        status: 'FAILED',
        reason: error.message,
      };
    }
  }
}

export const emailService = new EmailService();
