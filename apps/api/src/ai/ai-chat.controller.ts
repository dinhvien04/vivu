import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { FastifyRequest } from 'fastify';
import { GeminiService } from '../gemini/gemini.service';
import { QdrantRepository } from '../qdrant/qdrant.repository';
import { QdrantService } from '../qdrant/qdrant.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { AiChatService } from './ai-chat.service';
import { AiChatDto, AiDebugImageUrlDto, AiDebugTextDto } from './dto/ai-chat.dto';

const AI_CHAT_RATE_LIMIT_PER_MINUTE = positiveInteger(
  process.env.AI_CHAT_RATE_LIMIT_PER_MINUTE ?? process.env.AI_RATE_LIMIT_PER_MINUTE,
  10,
);

@ApiTags('ai')
@Controller('ai')
export class AiChatController {
  private readonly production: boolean;
  private readonly deepHealthEnabled: boolean;

  constructor(
    config: ConfigService,
    private readonly chat: AiChatService,
    private readonly qdrant: QdrantService,
    private readonly repository: QdrantRepository,
    private readonly gemini: GeminiService,
  ) {
    this.production = config.get<string>('NODE_ENV') === 'production';
    this.deepHealthEnabled = config.get<string>('AI_DEEP_HEALTH_ENABLED') === 'true';
  }

  @Post('chat')
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: AI_CHAT_RATE_LIMIT_PER_MINUTE } })
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiOperation({ summary: 'Chat với trợ lý AI du lịch bằng text, ảnh hoặc cả hai' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        session_id: { type: 'string' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  chatRequest(@Req() request: FastifyRequest, @Body() body: AiChatDto) {
    if (process.env.AI_FEATURE_ENABLED === 'false') {
      throw new ServiceUnavailableException('Vivu AI đang tạm bảo trì, vui lòng thử lại sau.');
    }
    return this.chat.handleRequest(request, body);
  }

  @Get('health')
  health() {
    if (this.production && !this.deepHealthEnabled) {
      return {
        status: 'ok',
        service: 'vivu-ai',
      };
    }

    return {
      status: 'ok',
      service: 'vivu-ai',
      qdrantConfigured: this.qdrant.isConfigured(),
      geminiConfigured: this.gemini.isConfigured(),
      geminiModel: this.gemini.model,
    };
  }

  @Get('health/qdrant')
  async qdrantHealth() {
    this.assertDeepHealthEnabled();
    try {
      return { status: 'ok', collections: await this.qdrant.getHealth() };
    } catch {
      throw new ServiceUnavailableException('Qdrant health check failed.');
    }
  }

  @Get('health/gemini')
  async geminiHealth() {
    this.assertDeepHealthEnabled();
    try {
      return await this.gemini.checkHealth();
    } catch {
      throw new ServiceUnavailableException('Gemini health check failed.');
    }
  }

  @Post('debug/search-text')
  searchText(@Body() body: AiDebugTextDto) {
    this.assertDebugEnabled();
    return this.repository.searchTextByMessage(body.message, {
      placeSlug: body.placeSlug,
    });
  }

  @Post('debug/search-image-by-text')
  searchImageByText(@Body() body: AiDebugTextDto) {
    this.assertDebugEnabled();
    return this.repository.searchImagesByText(body.message);
  }

  @Post('debug/search-image-by-url')
  searchImageByUrl(@Body() body: AiDebugImageUrlDto) {
    this.assertDebugEnabled();
    return this.repository.searchImagesByImageUrl(body.imageUrl);
  }

  private assertDebugEnabled(): void {
    if (this.production) throw new NotFoundException();
  }

  private assertDeepHealthEnabled(): void {
    if (this.production && !this.deepHealthEnabled) throw new NotFoundException();
  }
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}
