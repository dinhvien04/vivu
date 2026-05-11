import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PlacesService } from './places.service';
import { ListPlacesQueryDto } from './dto/list-places.query.dto';
import { NearbyPlacesQueryDto } from './dto/nearby-places.query.dto';

@ApiTags('places')
@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get()
  @ApiOkResponse({ description: 'Danh sách địa điểm có phân trang.' })
  list(@Query() query: ListPlacesQueryDto) {
    return this.placesService.list(query);
  }

  @Get('nearby')
  @ApiOkResponse({ description: 'Danh sách địa điểm gần một toạ độ (Haversine).' })
  async nearby(@Query() query: NearbyPlacesQueryDto) {
    const data = await this.placesService.listNearby({
      lat: query.lat,
      lng: query.lng,
      radiusKm: query.radius ?? 50,
      limit: query.limit ?? 8,
      excludeSlug: query.excludeSlug,
    });
    return { data };
  }

  @Get(':slug')
  @ApiOkResponse({ description: 'Chi tiết một địa điểm theo slug.' })
  async detail(@Param('slug') slug: string) {
    const place = await this.placesService.findBySlug(slug);
    if (!place) {
      throw new NotFoundException(`Không tìm thấy địa điểm: ${slug}`);
    }
    return { data: place };
  }
}
