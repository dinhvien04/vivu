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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Collection } from '@vivu/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { CollectionsService } from './collections.service';
import { AddCollectionItemDto } from './dto/add-item.dto';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

@ApiTags('collections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/collections')
export class CollectionsController {
  constructor(private readonly svc: CollectionsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async list(@CurrentUser() user: AuthenticatedUser): Promise<{ data: Collection[] }> {
    const data = await this.svc.list(user.id);
    return { data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCollectionDto,
  ): Promise<{ data: Collection }> {
    const data = await this.svc.create(user.id, dto);
    return { data };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async detail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ data: Collection }> {
    const data = await this.svc.getOwned(user.id, id);
    return { data };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCollectionDto,
  ): Promise<{ data: Collection }> {
    const data = await this.svc.update(user.id, id, dto);
    return { data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    await this.svc.remove(user.id, id);
  }

  @Post(':id/items')
  @HttpCode(HttpStatus.OK)
  async addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AddCollectionItemDto,
  ): Promise<{ data: Collection }> {
    const data = await this.svc.addItem(user.id, id, dto);
    return { data };
  }

  @Delete(':id/items/:placeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('placeId') placeId: string,
  ): Promise<void> {
    await this.svc.removeItem(user.id, id, placeId);
  }
}
