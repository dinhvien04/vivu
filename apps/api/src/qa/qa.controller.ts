import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Answer, Paginated, Question } from '@vivu/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { ListQuestionsQueryDto } from './dto/list-questions.query.dto';
import { QaService } from './qa.service';

@ApiTags('qa')
@Controller()
export class QaController {
  constructor(private readonly svc: QaService) {}

  /** Public: list questions globally (with optional placeSlug filter). */
  @Get('questions')
  listAll(@Query() query: ListQuestionsQueryDto): Promise<Paginated<Question>> {
    return this.svc.listAll(query);
  }

  /** Public: list questions for a specific place. */
  @Get('places/:idOrSlug/questions')
  listForPlace(
    @Param('idOrSlug') idOrSlug: string,
    @Query() query: ListQuestionsQueryDto,
  ): Promise<Paginated<Question>> {
    return this.svc.listForPlace(idOrSlug, query);
  }

  /** Public: question detail with answers. */
  @Get('questions/:id')
  async detail(@Param('id') id: string): Promise<{ data: Question }> {
    const data = await this.svc.getDetail(id);
    return { data };
  }

  /** Auth: ask a question about a place. */
  @Post('places/:idOrSlug/questions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  async createQuestion(
    @Param('idOrSlug') idOrSlug: string,
    @Body() dto: CreateQuestionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ data: Question }> {
    const data = await this.svc.createQuestion(idOrSlug, user.id, dto);
    return { data };
  }

  /** Auth (owner or admin): delete a question. */
  @Delete('questions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteQuestion(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.svc.deleteQuestion(id, user.id, user.role);
  }

  /** Auth: post an answer to a question. */
  @Post('questions/:id/answers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  async createAnswer(
    @Param('id') questionId: string,
    @Body() dto: CreateAnswerDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ data: Answer }> {
    const data = await this.svc.createAnswer(questionId, user.id, dto);
    return { data };
  }

  /** Auth (owner or admin): delete an answer. */
  @Delete('answers/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAnswer(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.svc.deleteAnswer(id, user.id, user.role);
  }
}
