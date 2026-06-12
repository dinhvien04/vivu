import { Module } from '@nestjs/common';
import { QdrantRepository } from './qdrant.repository';
import { QdrantService } from './qdrant.service';

@Module({
  providers: [QdrantService, QdrantRepository],
  exports: [QdrantService, QdrantRepository],
})
export class QdrantModule {}
