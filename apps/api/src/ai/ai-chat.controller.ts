import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { FastifyRequest } from 'fastify';
import { GeminiService } from '../gemini/gemini.service';
import { QdrantRepository } from '../qdrant/qdrant.repository';
import { QdrantService } from '../qdrant/qdrant.service';
import { AiChatService } from './ai-chat.service';
import { AiChatDto, AiDebugImageUrlDto, AiDebugTextDto } from './dto/ai-chat.dto';

@ApiTags('ai')
@Controller('ai')
export class AiChatController {
  private readonly production: boolean;

  constructor(
    config: ConfigService,
    private readonly chat: AiChatService,
    private readonly qdrant: QdrantService,
    private readonly repository: QdrantRepository,
    private readonly gemini: GeminiService,
  ) {
    this.production = config.get<string>('NODE_ENV') === 'production';
  }

  @Post('chat')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
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
    return this.chat.handleRequest(request, body);
  }

  @Get('health')
  health() {
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
    try {
      return { status: 'ok', collections: await this.qdrant.getHealth() };
    } catch {
      throw new ServiceUnavailableException('Qdrant health check failed.');
    }
  }

  @Get('health/gemini')
  async geminiHealth() {
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
}
