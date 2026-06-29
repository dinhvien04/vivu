import { UnauthorizedException } from '@nestjs/common';
import { Webhook } from 'svix';
import { ClerkWebhooksService } from './clerk-webhooks.service';

const WEBHOOK_SECRET = 'whsec_dGVzdF9zZWNyZXRfdGVzdF9zZWNyZXQ=';

function config(values: Record<string, string | undefined>) {
  return {
    get: jest.fn((key: string) => values[key]),
  };
}

function signedHeaders(secret: string, payload: string) {
  const webhook = new Webhook(secret);
  const timestamp = new Date();
  const id = 'msg_unit_test';
  return {
    svixId: id,
    svixTimestamp: `${Math.floor(timestamp.getTime() / 1000)}`,
    svixSignature: webhook.sign(id, timestamp, payload),
  };
}

describe('ClerkWebhooksService', () => {
  it('rejects invalid signatures', async () => {
    const service = new ClerkWebhooksService(
      { upsertClerkUserProfile: jest.fn(), markClerkUserDeleted: jest.fn() } as never,
      config({ CLERK_WEBHOOK_SECRET: WEBHOOK_SECRET }) as never,
    );

    await expect(
      service.handle({ type: 'user.created' }, {
        svixId: 'msg_bad',
        svixTimestamp: '1',
        svixSignature: 'bad',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('upserts users from Clerk create/update events', async () => {
    const secret = WEBHOOK_SECRET;
    const payload = JSON.stringify({
      type: 'user.created',
      data: {
        id: 'clerk_1',
        primary_email_address_id: 'email_1',
        email_addresses: [{ id: 'email_1', email_address: 'tester@example.com' }],
        first_name: 'Test',
        last_name: 'User',
        image_url: 'https://img.example.com/avatar.png',
      },
    });
    const clerkAuth = {
      upsertClerkUserProfile: jest.fn().mockResolvedValue({ id: 'user_1' }),
      markClerkUserDeleted: jest.fn(),
    };
    const service = new ClerkWebhooksService(
      clerkAuth as never,
      config({ CLERK_WEBHOOK_SECRET: secret }) as never,
    );

    await expect(service.handle(payload, signedHeaders(secret, payload))).resolves.toEqual({
      ok: true,
    });
    expect(clerkAuth.upsertClerkUserProfile).toHaveBeenCalledWith({
      clerkUserId: 'clerk_1',
      email: 'tester@example.com',
      name: 'Test User',
      avatarUrl: 'https://img.example.com/avatar.png',
    });
  });

  it('soft-deletes users from Clerk delete events', async () => {
    const secret = WEBHOOK_SECRET;
    const payload = JSON.stringify({ type: 'user.deleted', data: { id: 'clerk_1' } });
    const clerkAuth = {
      upsertClerkUserProfile: jest.fn(),
      markClerkUserDeleted: jest.fn().mockResolvedValue(undefined),
    };
    const service = new ClerkWebhooksService(
      clerkAuth as never,
      config({ CLERK_WEBHOOK_SECRET: secret }) as never,
    );

    await expect(service.handle(payload, signedHeaders(secret, payload))).resolves.toEqual({
      ok: true,
    });
    expect(clerkAuth.markClerkUserDeleted).toHaveBeenCalledWith('clerk_1');
  });
});
