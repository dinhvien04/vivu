import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PlacesService } from './places.service';
import { ListPlacesQueryDto } from './dto/list-places.query.dto';

@ApiTags('places')
@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get()
  @ApiOkResponse({ description: 'Danh sách địa điểm có phân trang.' })
  list(@Query() query: ListPlacesQueryDto) {
    return this.placesService.list(query);
  }

  @Get(':slug')
  @ApiOkResponse({ description: 'Chi tiết một địa điểm theo slug.' })
  detail(@Param('slug') slug: string) {
    const place = this.placesService.findBySlug(slug);
    if (!place) {
      throw new NotFoundException(`Không tìm thấy địa điểm: ${slug}`);
    }
    return { data: place };
  }
}
