import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resendApiKey: string | undefined;
  private readonly from: string;
  private readonly production: boolean;

  constructor(config: ConfigService) {
    this.resendApiKey = config.get<string>('RESEND_API_KEY')?.trim();
    this.from = config.get<string>('EMAIL_FROM')?.trim() || 'Vivu <noreply@vivu.vn>';
    this.production = config.get<string>('NODE_ENV') === 'production';
  }

  isConfigured(): boolean {
    return Boolean(this.resendApiKey);
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    const subject = 'Đặt lại mật khẩu Vivu';
    const html = `
      <p>Xin chào,</p>
      <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản Vivu.</p>
      <p><a href="${resetUrl}">Nhấn vào đây để đặt lại mật khẩu</a></p>
      <p>Liên kết có hiệu lực trong 30 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
    `.trim();

    if (!this.resendApiKey) {
      if (this.production) {
        this.logger.error('RESEND_API_KEY is not configured; password reset email was not sent.');
      } else {
        this.logger.warn(`Password reset link (DEV ONLY): ${resetUrl}`);
      }
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      this.logger.error(`Resend API error ${response.status}: ${text}`);
      throw new Error('Không gửi được email đặt lại mật khẩu');
    }
  }
}