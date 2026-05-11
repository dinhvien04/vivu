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
import type { Paginated, Photo, Place } from '@vivu/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { ListPlacesQueryDto } from '../places/dto/list-places.query.dto';
import { AdminPlacesService } from './admin-places.service';
import { AddPhotoDto } from './dto/add-photo.dto';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';

@ApiTags('admin/places')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'editor')
@Controller('admin/places')
export class AdminPlacesController {
  constructor(
    private readonly svc: AdminPlacesService,
    private readonly audit: AuditLogsService,
  ) {}

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
  async create(
    @Body() dto: CreatePlaceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ data: Place }> {
    const data = await this.svc.create(dto);
    await this.audit.record({
      actorId: user.id,
      action: 'place.create',
      entityType: 'place',
      entityId: data.id,
      metadata: { slug: data.slug, status: data.status },
    });
    return { data };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePlaceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ data: Place }> {
    const data = await this.svc.update(id, dto);
    await this.audit.record({
      actorId: user.id,
      action: 'place.update',
      entityType: 'place',
      entityId: data.id,
      metadata: { slug: data.slug },
    });
    return { data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.svc.remove(id);
    await this.audit.record({
      actorId: user.id,
      action: 'place.delete',
      entityType: 'place',
      entityId: id,
    });
  }

  @Post(':id/publish')
  async publish(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ data: Place }> {
    const data = await this.svc.setStatus(id, 'published');
    await this.audit.record({
      actorId: user.id,
      action: 'place.publish',
      entityType: 'place',
      entityId: data.id,
      metadata: { slug: data.slug },
    });
    return { data };
  }

  @Post(':id/unpublish')
  async unpublish(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ data: Place }> {
    const data = await this.svc.setStatus(id, 'draft');
    await this.audit.record({
      actorId: user.id,
      action: 'place.unpublish',
      entityType: 'place',
      entityId: data.id,
      metadata: { slug: data.slug },
    });
    return { data };
  }

  @Post(':id/photos')
  @HttpCode(HttpStatus.CREATED)
  async addPhoto(
    @Param('id') id: string,
    @Body() dto: AddPhotoDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ data: Photo }> {
    const data = await this.svc.addPhoto(id, dto);
    await this.audit.record({
      actorId: user.id,
      action: 'place.photo.add',
      entityType: 'place',
      entityId: id,
      metadata: { photoId: data.id },
    });
    return { data };
  }

  @Delete(':id/photos/:photoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.svc.removePhoto(id, photoId);
    await this.audit.record({
      actorId: user.id,
      action: 'place.photo.remove',
      entityType: 'place',
      entityId: id,
      metadata: { photoId },
    });
  }
}
