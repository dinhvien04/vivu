import { Global, Module } from '@nestjs/common';
import { SearchIndexService } from './search-index.service';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Global()
@Module({
  controllers: [SearchController],
  providers: [SearchService, SearchIndexService],
  exports: [SearchIndexService],
})
export class SearchModule {}
