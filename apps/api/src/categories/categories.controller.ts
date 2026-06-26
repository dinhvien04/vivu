import { Controller, Get, Header } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=3600')
  @ApiOkResponse({ description: 'Danh sách danh mục/chủ đề.' })
  async list() {
    return { data: await this.categoriesService.list() };
  }
}
