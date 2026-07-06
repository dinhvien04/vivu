import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  Answer as PrismaAnswer,
  Prisma,
  Question as PrismaQuestion,
  User as PrismaUser,
} from '@prisma/client';
import type { Answer, Paginated, Question } from '@vivu/types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { ListQuestionsQueryDto } from './dto/list-questions.query.dto';

type AuthorSelect = Pick<PrismaUser, 'id' | 'name' | 'avatarUrl'>;
type AnswerWithUser = PrismaAnswer & { user: AuthorSelect };
type QuestionListRow = PrismaQuestion & {
  user: AuthorSelect;
  place?: { id: string; slug: string; titleVi: string };
  _count: { answers: number };
};
type QuestionDetailRow = PrismaQuestion & {
  user: AuthorSelect;
  place?: { id: string; slug: string; titleVi: string };
  answers: AnswerWithUser[];
};

const AUTHOR_SELECT = { id: true, name: true, avatarUrl: true } as const;

const QUESTION_LIST_INCLUDE = {
  user: { select: AUTHOR_SELECT },
  place: { select: { id: true, slug: true, titleVi: true } },
  _count: { select: { answers: true } },
} as const;

const QUESTION_DETAIL_INCLUDE = {
  user: { select: AUTHOR_SELECT },
  place: { select: { id: true, slug: true, titleVi: true } },
  answers: {
    orderBy: { createdAt: 'asc' as const },
    include: { user: { select: AUTHOR_SELECT } },
  },
} as const;

function toApiAnswer(a: AnswerWithUser): Answer {
  return {
    id: a.id,
    questionId: a.questionId,
    content: a.content,
    createdAt: a.createdAt.toISOString(),
    user: { id: a.user.id, name: a.user.name, avatarUrl: a.user.avatarUrl },
  };
}

function toApiQuestionList(q: QuestionListRow): Question {
  return {
    id: q.id,
    placeId: q.placeId,
    content: q.content,
    createdAt: q.createdAt.toISOString(),
    user: { id: q.user.id, name: q.user.name, avatarUrl: q.user.avatarUrl },
    ...(q.place ? { place: q.place } : {}),
    answersCount: q._count.answers,
  };
}

function toApiQuestionDetail(q: QuestionDetailRow): Question {
  return {
    id: q.id,
    placeId: q.placeId,
    content: q.content,
    createdAt: q.createdAt.toISOString(),
    user: { id: q.user.id, name: q.user.name, avatarUrl: q.user.avatarUrl },
    ...(q.place ? { place: q.place } : {}),
    answersCount: q.answers.length,
    answers: q.answers.map(toApiAnswer),
  };
}

@Injectable()
export class QaService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolvePlaceId(idOrSlug: string): Promise<string> {
    const place = await this.prisma.place.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        status: 'published',
      },
      select: { id: true },
    });
    if (!place) throw new NotFoundException('Không tìm thấy địa điểm');
    return place.id;
  }

  async listForPlace(idOrSlug: string, query: ListQuestionsQueryDto): Promise<Paginated<Question>> {
    const placeId = await this.resolvePlaceId(idOrSlug);
    return this.listInternal({ placeId }, query);
  }

  async listAll(query: ListQuestionsQueryDto): Promise<Paginated<Question>> {
    const where: Prisma.QuestionWhereInput = {};
    if (query.placeSlug) {
      where.place = { slug: query.placeSlug };
    }
    return this.listInternal(where, query);
  }

  private async listInternal(
    where: Prisma.QuestionWhereInput,
    query: ListQuestionsQueryDto,
  ): Promise<Paginated<Question>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.question.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: QUESTION_LIST_INCLUDE,
      }),
      this.prisma.question.count({ where }),
    ]);
    return {
      data: rows.map((r) => toApiQuestionList(r as QuestionListRow)),
      meta: { page, pageSize, total },
    };
  }

  async getDetail(id: string): Promise<Question> {
    const q = await this.prisma.question.findUnique({
      where: { id },
      include: QUESTION_DETAIL_INCLUDE,
    });
    if (!q) throw new NotFoundException('Không tìm thấy câu hỏi');
    return toApiQuestionDetail(q as QuestionDetailRow);
  }

  async createQuestion(
    idOrSlug: string,
    userId: string,
    dto: CreateQuestionDto,
  ): Promise<Question> {
    const placeId = await this.resolvePlaceId(idOrSlug);
    const created = await this.prisma.question.create({
      data: { placeId, userId, content: dto.content },
      include: QUESTION_DETAIL_INCLUDE,
    });
    return toApiQuestionDetail(created as QuestionDetailRow);
  }

  async deleteQuestion(id: string, userId: string, role: string): Promise<void> {
    const existing = await this.prisma.question.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy câu hỏi');
    const isAdmin = role === 'admin' || role === 'editor';
    if (existing.userId !== userId && !isAdmin) {
      throw new ForbiddenException('Bạn không có quyền xoá câu hỏi này');
    }
    await this.prisma.question.delete({ where: { id } });
  }

  async createAnswer(questionId: string, userId: string, dto: CreateAnswerDto): Promise<Answer> {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true },
    });
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi');
    const created = await this.prisma.answer.create({
      data: { questionId, userId, content: dto.content },
      include: { user: { select: AUTHOR_SELECT } },
    });
    return toApiAnswer(created as AnswerWithUser);
  }

  async deleteAnswer(id: string, userId: string, role: string): Promise<void> {
    const existing = await this.prisma.answer.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy câu trả lời');
    const isAdmin = role === 'admin' || role === 'editor';
    if (existing.userId !== userId && !isAdmin) {
      throw new ForbiddenException('Bạn không có quyền xoá câu trả lời này');
    }
    await this.prisma.answer.delete({ where: { id } });
  }
}
