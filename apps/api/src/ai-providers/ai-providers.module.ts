import { Module } from '@nestjs/common';
import { GeminiModule } from '../gemini/gemini.module';
import { AiTextGenerationService } from './ai-text-generation.service';
import { ConduitAiService } from './conduit-ai.service';

@Module({
  imports: [GeminiModule],
  providers: [AiTextGenerationService, ConduitAiService],
  exports: [AiTextGenerationService, ConduitAiService],
})
export class AiProvidersModule {}
