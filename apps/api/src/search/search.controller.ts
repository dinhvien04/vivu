import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SuggestQueryDto } from './dto/suggest.query.dto';
import { SearchService, type SuggestPlace } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly svc: SearchService) {}

  @Get('suggest')
  @ApiOkResponse({ description: 'Gợi ý địa điểm cho typeahead (pg_trgm similarity).' })
  async suggest(@Query() query: SuggestQueryDto): Promise<{ data: SuggestPlace[] }> {
    const data = await this.svc.suggest(query.q, query.limit);
    return { data };
  }
}
