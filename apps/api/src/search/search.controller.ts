import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SuggestQueryDto } from './dto/suggest.query.dto';
import { SearchService, type SuggestPlace } from './search.service';

const SEARCH_RATE_LIMIT_PER_MINUTE = positiveInteger(process.env.SEARCH_RATE_LIMIT_PER_MINUTE, 60);

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly svc: SearchService) {}

  @Get('suggest')
  @Throttle({ default: { ttl: 60_000, limit: SEARCH_RATE_LIMIT_PER_MINUTE } })
  @ApiOkResponse({ description: 'Gợi ý địa điểm cho typeahead (pg_trgm similarity).' })
  async suggest(@Query() query: SuggestQueryDto): Promise<{ data: SuggestPlace[] }> {
    const data = await this.svc.suggest(query.q, query.limit);
    return { data };
  }
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}
