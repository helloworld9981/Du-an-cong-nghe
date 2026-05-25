import nodemailer from 'nodemailer';
import config from '../config/env.config';
import { createLogger } from '../utils/logger';

const logger = createLogger('EmailService');

export interface EmailService {
  sendEmail: (to: string, subject: string, text: string, html?: string) => Promise<boolean>;
}

class EmailServiceImpl implements EmailService {
  private transporter: nodemailer.Transporter | null = null;

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: parseInt(config.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS,
        },
      });
    }
    return this.transporter as nodemailer.Transporter;
  }

  async sendEmail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();

      const mailOptions = {
        from: config.FROM_EMAIL,
        to,
        subject,
        text,
        ...(html && { html })
      };

      await transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', 'sendEmail', { to, subject });
      return true;
    } catch (error) {
      logger.error('Failed to send email', 'sendEmail', { to, subject, error });
      return false;
    }
  }
}

export const emailService: EmailService = new EmailServiceImpl();