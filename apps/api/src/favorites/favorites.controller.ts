import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Place } from '@vivu/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { FavoritesService } from './favorites.service';

@ApiTags('favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class FavoritesController {
  constructor(private readonly svc: FavoritesService) {}

  @Post('places/:id/favorite')
  @HttpCode(HttpStatus.OK)
  async add(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') placeId: string,
  ): Promise<{ favorited: true }> {
    return this.svc.add(user.id, placeId);
  }

  @Delete('places/:id/favorite')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') placeId: string,
  ): Promise<void> {
    await this.svc.remove(user.id, placeId);
  }

  @Get('places/:id/favorite')
  @HttpCode(HttpStatus.OK)
  status(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') placeId: string,
  ): Promise<{ favorited: boolean }> {
    return this.svc.status(user.id, placeId);
  }

  @Get('me/favorites')
  @HttpCode(HttpStatus.OK)
  async list(@CurrentUser() user: AuthenticatedUser): Promise<{ data: Place[] }> {
    const data = await this.svc.listForUser(user.id);
    return { data };
  }
}
