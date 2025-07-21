import crypto from "crypto";
import { ckStorageExtended } from "../storage/ck-storage-extended";

interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'mailgun' | 'resend' | 'gmail' | 'outlook';
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  apiKey?: string;
  domain?: string;
  fromEmail: string;
  fromName: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export class EmailService {
  private config: EmailConfig;
  private templates: Record<string, EmailTemplate>;

  constructor() {
    this.config = {
      provider: 'smtp',
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
      apiKey: process.env.EMAIL_API_KEY,
      domain: process.env.EMAIL_DOMAIN,
      fromEmail: process.env.FROM_EMAIL || 'noreply@chatkingai.com',
      fromName: process.env.FROM_NAME || 'ChatKing AI',
    };

    this.templates = {
      verification: {
        subject: 'Verify Your ChatKing Account',
        html: this.getVerificationTemplate(),
        text: 'Please verify your email address by clicking the link in this email.',
      },
      passwordReset: {
        subject: 'Reset Your ChatKing Password',
        html: this.getPasswordResetTemplate(),
        text: 'Click the link to reset your password.',
      },
      welcome: {
        subject: 'Welcome to ChatKing AI!',
        html: this.getWelcomeTemplate(),
        text: 'Welcome to ChatKing AI! Your account has been created successfully.',
      },
      securityAlert: {
        subject: 'Security Alert - ChatKing Account',
        html: this.getSecurityAlertTemplate(),
        text: 'Security alert for your ChatKing account.',
      },
    };
  }

  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const fromAddress = options.from || `${this.config.fromName} <${this.config.fromEmail}>`;

      switch (this.config.provider) {
        case 'smtp':
          return await this.sendViaSMTP(options, fromAddress);
        case 'sendgrid':
          return await this.sendViaSendGrid(options, fromAddress);
        case 'mailgun':
          return await this.sendViaMailgun(options, fromAddress);
        case 'resend':
          return await this.sendViaResend(options, fromAddress);
        case 'gmail':
          return await this.sendViaGmail(options, fromAddress);
        default:
          return await this.sendViaSMTP(options, fromAddress);
      }
    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async sendViaSMTP(options: SendEmailOptions, from: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // For now, simulate SMTP sending
    // In production, you'd use nodemailer or similar
    console.log('📧 SMTP Email (simulated):', {
      from,
      to: options.to,
      subject: options.subject,
      bodyLength: options.html.length,
    });

    return {
      success: true,
      messageId: `smtp_${crypto.randomUUID()}`,
    };
  }

  private async sendViaSendGrid(options: SendEmailOptions, from: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.config.apiKey) {
      return { success: false, error: 'SendGrid API key not configured' };
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: options.to }],
            subject: options.subject,
          }],
          from: { email: this.config.fromEmail, name: this.config.fromName },
          content: [
            { type: 'text/html', value: options.html },
            { type: 'text/plain', value: options.text || this.stripHtml(options.html) },
          ],
        }),
      });

      if (response.ok) {
        return { success: true, messageId: response.headers.get('x-message-id') || 'sendgrid_success' };
      } else {
        const error = await response.text();
        return { success: false, error: `SendGrid error: ${error}` };
      }
    } catch (error) {
      return { success: false, error: `SendGrid request failed: ${error}` };
    }
  }

  private async sendViaMailgun(options: SendEmailOptions, from: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.config.apiKey || !this.config.domain) {
      return { success: false, error: 'Mailgun API key or domain not configured' };
    }

    try {
      const formData = new FormData();
      formData.append('from', from);
      formData.append('to', options.to);
      formData.append('subject', options.subject);
      formData.append('html', options.html);
      formData.append('text', options.text || this.stripHtml(options.html));

      const response = await fetch(`https://api.mailgun.net/v3/${this.config.domain}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${this.config.apiKey}`).toString('base64')}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, messageId: result.id };
      } else {
        const error = await response.text();
        return { success: false, error: `Mailgun error: ${error}` };
      }
    } catch (error) {
      return { success: false, error: `Mailgun request failed: ${error}` };
    }
  }

  private async sendViaResend(options: SendEmailOptions, from: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.config.apiKey) {
      return { success: false, error: 'Resend API key not configured' };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: from,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text || this.stripHtml(options.html),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, messageId: result.id };
      } else {
        const error = await response.text();
        return { success: false, error: `Resend error: ${error}` };
      }
    } catch (error) {
      return { success: false, error: `Resend request failed: ${error}` };
    }
  }

  private async sendViaGmail(options: SendEmailOptions, from: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Gmail API implementation would go here
    // For now, fallback to SMTP simulation
    console.log('📧 Gmail API (simulated):', {
      from,
      to: options.to,
      subject: options.subject,
    });

    return {
      success: true,
      messageId: `gmail_${crypto.randomUUID()}`,
    };
  }

  async sendVerificationEmail(email: string, token: string, userName?: string): Promise<{ success: boolean; error?: string }> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    const template = this.templates.verification;

    const html = template.html
      .replace('{{userName}}', userName || 'User')
      .replace('{{verificationUrl}}', verificationUrl)
      .replace('{{token}}', token);

    const result = await this.sendEmail({
      to: email,
      subject: template.subject,
      html,
      text: `Please verify your email by visiting: ${verificationUrl}`,
    });

    return { success: result.success, error: result.error };
  }

  async sendPasswordResetEmail(email: string, token: string, userName?: string): Promise<{ success: boolean; error?: string }> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    const template = this.templates.passwordReset;

    const html = template.html
      .replace('{{userName}}', userName || 'User')
      .replace('{{resetUrl}}', resetUrl)
      .replace('{{token}}', token);

    const result = await this.sendEmail({
      to: email,
      subject: template.subject,
      html,
      text: `Reset your password by visiting: ${resetUrl}`,
    });

    return { success: result.success, error: result.error };
  }

  async sendWelcomeEmail(email: string, userName: string): Promise<{ success: boolean; error?: string }> {
    const template = this.templates.welcome;

    const html = template.html
      .replace('{{userName}}', userName)
      .replace('{{loginUrl}}', `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`);

    const result = await this.sendEmail({
      to: email,
      subject: template.subject,
      html,
      text: `Welcome to ChatKing AI, ${userName}!`,
    });

    return { success: result.success, error: result.error };
  }

  async sendSecurityAlert(email: string, alertType: string, details: any): Promise<{ success: boolean; error?: string }> {
    const template = this.templates.securityAlert;

    const html = template.html
      .replace('{{alertType}}', alertType)
      .replace('{{details}}', JSON.stringify(details, null, 2))
      .replace('{{timestamp}}', new Date().toISOString());

    const result = await this.sendEmail({
      to: email,
      subject: `${template.subject} - ${alertType}`,
      html,
      text: `Security alert: ${alertType}`,
    });

    return { success: result.success, error: result.error };
  }

  async generateVerificationToken(email: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await ckStorageExtended.storeEmailVerificationToken(email, token, expiresAt);
    return token;
  }

  async verifyEmailToken(token: string): Promise<{ valid: boolean; email?: string; error?: string }> {
    const tokenData = await ckStorageExtended.getEmailVerificationToken(token);

    if (!tokenData) {
      return { valid: false, error: 'Invalid verification token' };
    }

    if (new Date(tokenData.expiresAt) < new Date()) {
      return { valid: false, error: 'Verification token has expired' };
    }

    if (tokenData.verified) {
      return { valid: false, error: 'Email already verified' };
    }

    const success = await ckStorageExtended.markEmailAsVerified(token);
    if (success) {
      return { valid: true, email: tokenData.email };
    } else {
      return { valid: false, error: 'Failed to verify email' };
    }
  }

  async generatePasswordResetToken(email: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

    await ckStorageExtended.storePasswordResetToken(email, token, expiresAt);
    return token;
  }

  async verifyPasswordResetToken(token: string): Promise<{ valid: boolean; email?: string; error?: string }> {
    const tokenData = await ckStorageExtended.getPasswordResetToken(token);

    if (!tokenData) {
      return { valid: false, error: 'Invalid reset token' };
    }

    if (new Date(tokenData.expiresAt) < new Date()) {
      return { valid: false, error: 'Reset token has expired' };
    }

    if (tokenData.used) {
      return { valid: false, error: 'Reset token already used' };
    }

    return { valid: true, email: tokenData.email };
  }

  async markPasswordResetTokenAsUsed(token: string): Promise<boolean> {
    return await ckStorageExtended.markPasswordResetTokenAsUsed(token);
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  private getVerificationTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .button { display: inline-block; background: #6366f1; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🤖 ChatKing AI</h1>
        </div>
        <div class="content">
          <h2>Hi {{userName}}!</h2>
          <p>Welcome to ChatKing AI! To complete your registration and secure your account, please verify your email address.</p>
          <p>Click the button below to verify your email:</p>
          <a href="{{verificationUrl}}" class="button">Verify Email Address</a>
          <p>Or copy and paste this link into your browser:</p>
          <p><code>{{verificationUrl}}</code></p>
          <p>This verification link will expire in 24 hours for security purposes.</p>
          <p>If you didn't create an account with ChatKing AI, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2024 ChatKing AI. All rights reserved.</p>
          <p>Advanced AI-powered conversations and tools.</p>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444, #f97316); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .button { display: inline-block; background: #ef4444; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔐 Password Reset</h1>
        </div>
        <div class="content">
          <h2>Hi {{userName}}!</h2>
          <p>We received a request to reset your ChatKing AI account password.</p>
          <p>Click the button below to reset your password:</p>
          <a href="{{resetUrl}}" class="button">Reset Password</a>
          <p>Or copy and paste this link into your browser:</p>
          <p><code>{{resetUrl}}</code></p>
          <p><strong>This reset link will expire in 2 hours for security purposes.</strong></p>
          <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
        </div>
        <div class="footer">
          <p>© 2024 ChatKing AI. All rights reserved.</p>
          <p>Keep your account secure with strong passwords.</p>
        </div>
      </body>
      </html>
    `;
  }

  private getWelcomeTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ChatKing AI</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .button { display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .features { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Welcome!</h1>
        </div>
        <div class="content">
          <h2>Hi {{userName}}!</h2>
          <p>Welcome to ChatKing AI! Your account has been successfully created and verified.</p>
          <div class="features">
            <h3>🚀 What you can do with ChatKing AI:</h3>
            <ul>
              <li><strong>AI Chat:</strong> Have intelligent conversations with advanced AI models</li>
              <li><strong>Web Search:</strong> Search the web with AI-powered insights</li>
              <li><strong>Calculator:</strong> Perform complex calculations and unit conversions</li>
              <li><strong>Pinecone Index:</strong> Store and search your knowledge base</li>
              <li><strong>Secure Storage:</strong> Your data is encrypted and protected</li>
            </ul>
          </div>
          <p>Ready to get started?</p>
          <a href="{{loginUrl}}" class="button">Start Using ChatKing AI</a>
          <p>If you have any questions or need help, feel free to reach out to our support team.</p>
        </div>
        <div class="footer">
          <p>© 2024 ChatKing AI. All rights reserved.</p>
          <p>Your journey into advanced AI begins now!</p>
        </div>
      </body>
      </html>
    `;
  }

  private getSecurityAlertTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Security Alert</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626, #991b1b); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .alert { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚨 Security Alert</h1>
        </div>
        <div class="content">
          <h2>Security Alert: {{alertType}}</h2>
          <p>We detected unusual activity on your ChatKing AI account.</p>
          <div class="alert">
            <h3>Alert Details:</h3>
            <pre>{{details}}</pre>
            <p><strong>Time:</strong> {{timestamp}}</p>
          </div>
          <p>If this was you, no action is needed. If this wasn't you, please secure your account immediately.</p>
          <p>For your security, we recommend:</p>
          <ul>
            <li>Change your password immediately</li>
            <li>Review your account activity</li>
            <li>Enable two-factor authentication</li>
            <li>Contact support if you need assistance</li>
          </ul>
        </div>
        <div class="footer">
          <p>© 2024 ChatKing AI. All rights reserved.</p>
          <p>Your security is our priority.</p>
        </div>
      </body>
      </html>
    `;
  }

  updateConfig(newConfig: Partial<EmailConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): EmailConfig {
    // Return config without sensitive information
    return {
      ...this.config,
      pass: this.config.pass ? '***' : undefined,
      apiKey: this.config.apiKey ? '***' : undefined,
    };
  }

  async testEmailConfig(): Promise<{ success: boolean; error?: string }> {
    try {
      // Send a test email to verify configuration
      const testResult = await this.sendEmail({
        to: this.config.fromEmail,
        subject: 'ChatKing Email Service Test',
        html: '<p>This is a test email to verify the email service configuration.</p>',
        text: 'This is a test email to verify the email service configuration.',
      });

      return testResult;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const emailService = new EmailService();
