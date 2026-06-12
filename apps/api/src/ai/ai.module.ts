import { Module } from '@nestjs/common';
import { GeminiModule } from '../gemini/gemini.module';
import { QdrantModule } from '../qdrant/qdrant.module';
import { StorageModule } from '../storage/storage.module';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { ImageOnlyPipeline } from './pipelines/image-only.pipeline';
import { ImageTextPipeline } from './pipelines/image-text.pipeline';
import { TextOnlyPipeline } from './pipelines/text-only.pipeline';
import { ContextBuilderService } from './services/context-builder.service';
import { ImageUrlService } from './services/image-url.service';
import { InputRouterService } from './services/input-router.service';
import { ResponseFormatterService } from './services/response-formatter.service';

@Module({
  imports: [QdrantModule, GeminiModule, StorageModule],
  controllers: [AiChatController],
  providers: [
    AiChatService,
    InputRouterService,
    ContextBuilderService,
    ResponseFormatterService,
    ImageUrlService,
    TextOnlyPipeline,
    ImageOnlyPipeline,
    ImageTextPipeline,
  ],
})
export class AiModule {}
