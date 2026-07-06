import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { TurnstileService } from './turnstile.service';

@Global()
@Module({
  providers: [TurnstileService, EmailService],
  exports: [TurnstileService, EmailService],
})
export class AbuseProtectionModule {}
