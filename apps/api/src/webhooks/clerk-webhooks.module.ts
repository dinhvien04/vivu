import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClerkWebhooksController } from './clerk-webhooks.controller';
import { ClerkWebhooksService } from './clerk-webhooks.service';

@Module({
  imports: [AuthModule],
  controllers: [ClerkWebhooksController],
  providers: [ClerkWebhooksService],
})
export class ClerkWebhooksModule {}
