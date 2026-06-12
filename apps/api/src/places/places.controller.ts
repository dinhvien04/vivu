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
  @ApiOkResponse({ description: 'Paginated place list.' })
  list(@Query() query: ListPlacesQueryDto) {
    return this.placesService.list(query);
  }

  @Get('nearby')
  @ApiOkResponse({ description: 'Places near a coordinate using Haversine/PostGIS.' })
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

  @Get(':slug/images')
  @ApiOkResponse({ description: 'S3 images for a place, returned as presigned URLs.' })
  async images(@Param('slug') slug: string) {
    const images = await this.placesService.listImages(slug);
    if (!images) {
      throw new NotFoundException(`Khong tim thay dia diem: ${slug}`);
    }
    return { data: images };
  }

  @Get(':slug')
  @ApiOkResponse({ description: 'Place detail by slug.' })
  async detail(@Param('slug') slug: string) {
    const place = await this.placesService.findBySlug(slug);
    if (!place) {
      throw new NotFoundException(`Khong tim thay dia diem: ${slug}`);
    }
    return { data: place };
  }
}
