import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { WebhookEvent } from '@clerk/backend';
import { Webhook } from 'svix';
import {
  ClerkAuthService,
  profileFromWebhookData,
} from '../auth/clerk-auth.service';

@Injectable()
export class ClerkWebhooksService {
  private readonly webhookSecret?: string;

  constructor(
    private readonly clerkAuth: ClerkAuthService,
    config: ConfigService,
  ) {
    const secret = config.get<string>('CLERK_WEBHOOK_SECRET')?.trim();
    this.webhookSecret = secret || undefined;
  }

  async handle(
    body: unknown,
    headers: {
      svixId?: string;
      svixTimestamp?: string;
      svixSignature?: string;
    },
  ): Promise<{ ok: true }> {
    const event = this.verify(body, headers);

    if (event.type === 'user.created' || event.type === 'user.updated') {
      await this.clerkAuth.upsertClerkUserProfile(profileFromWebhookData(event.data));
    }

    if (event.type === 'user.deleted') {
      const clerkUserId =
        event.data && typeof event.data === 'object' && 'id' in event.data
          ? String(event.data.id ?? '')
          : '';
      if (clerkUserId) {
        await this.clerkAuth.markClerkUserDeleted(clerkUserId);
      }
    }

    return { ok: true };
  }

  private verify(
    body: unknown,
    headers: {
      svixId?: string;
      svixTimestamp?: string;
      svixSignature?: string;
    },
  ): WebhookEvent {
    if (!this.webhookSecret) {
      throw new UnauthorizedException('CLERK_WEBHOOK_SECRET is not configured');
    }
    if (!headers.svixId || !headers.svixTimestamp || !headers.svixSignature) {
      throw new UnauthorizedException('Missing Clerk webhook signature headers');
    }

    const payload = typeof body === 'string' ? body : JSON.stringify(body);
    const webhook = new Webhook(this.webhookSecret);
    try {
      return webhook.verify(payload, {
        'svix-id': headers.svixId,
        'svix-timestamp': headers.svixTimestamp,
        'svix-signature': headers.svixSignature,
      }) as WebhookEvent;
    } catch {
      throw new UnauthorizedException('Invalid Clerk webhook signature');
    }
  }
}
