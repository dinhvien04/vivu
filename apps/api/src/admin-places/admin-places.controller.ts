import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Paginated, Place } from '@vivu/types';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ListPlacesQueryDto } from '../places/dto/list-places.query.dto';
import { AdminPlacesService } from './admin-places.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';

@ApiTags('admin/places')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'editor')
@Controller('admin/places')
export class AdminPlacesController {
  constructor(private readonly svc: AdminPlacesService) {}

  @Get()
  list(@Query() query: ListPlacesQueryDto): Promise<Paginated<Place>> {
    return this.svc.list(query);
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string): Promise<{ data: Place }> {
    const data = await this.svc.findBySlug(slug);
    return { data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePlaceDto): Promise<{ data: Place }> {
    const data = await this.svc.create(dto);
    return { data };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePlaceDto): Promise<{ data: Place }> {
    const data = await this.svc.update(id, dto);
    return { data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.svc.remove(id);
  }

  @Post(':id/publish')
  async publish(@Param('id') id: string): Promise<{ data: Place }> {
    const data = await this.svc.setStatus(id, 'published');
    return { data };
  }

  @Post(':id/unpublish')
  async unpublish(@Param('id') id: string): Promise<{ data: Place }> {
    const data = await this.svc.setStatus(id, 'draft');
    return { data };
  }
}
