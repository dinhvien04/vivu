import { Body, Controller, Headers, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { Public } from '../auth/decorators/public.decorator';
import { ClerkWebhooksService } from './clerk-webhooks.service';

type RawBodyFastifyRequest = FastifyRequest & { rawBody?: Buffer | string };

@Controller('webhooks/clerk')
export class ClerkWebhooksController {
  constructor(private readonly webhooks: ClerkWebhooksService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  handle(
    @Body() body: unknown,
    @Req() request: RawBodyFastifyRequest,
    @Headers('svix-id') svixId?: string,
    @Headers('svix-timestamp') svixTimestamp?: string,
    @Headers('svix-signature') svixSignature?: string,
  ): Promise<{ ok: true }> {
    const payload = request.rawBody ? request.rawBody.toString() : body;
    return this.webhooks.handle(payload, { svixId, svixTimestamp, svixSignature });
  }
}
