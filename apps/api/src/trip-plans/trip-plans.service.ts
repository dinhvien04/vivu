import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import type { FastifyRequest } from 'fastify';
import { GeminiService } from '../gemini/gemini.service';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import type { GenerateTripPlanDto } from './dto/generate-trip-plan.dto';
import { parseTripPlanOutput } from './trip-plan-json';
import { TripPlannerQuotaService } from './trip-planner-quota.service';
import type { TripPlanOutput } from './trip-plan.types';

const PUBLIC_PROVINCE = 'Gia Lai';

const AREA_KEYWORDS: Record<string, string[]> = {
  pleiku: ['pleiku', 'biển hồ', 'bien ho', 'nhà lao pleiku'],
  'quy-nhon': ['quy nhơn', 'quy nhon', 'ghềnh ráng', 'gành ráng', 'kỳ co', 'eo gió'],
  'an-nhon': ['an nhơn', 'an nhon'],
  'tuy-phuoc': ['tuy phước', 'tuy phuoc'],
  'phu-cat': ['phù cát', 'phu cat'],
  'phu-my': ['phù mỹ', 'phu my'],
  'hoai-nhon': ['hoài nhơn', 'hoai nhon'],
};

type CandidatePlace = Prisma.PlaceGetPayload<{
  include: {
    region: true;
    categories: { include: { category: true } };
  };
}>;

@Injectable()
export class TripPlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly quota: TripPlannerQuotaService,
  ) {}

  async generate(
    dto: GenerateTripPlanDto,
    request: FastifyRequest,
    user?: AuthenticatedUser,
  ): Promise<{ data: { id: string; title: string; output: TripPlanOutput; shareId: string | null; isPublic: boolean } }> {
    await this.quota.consume(request, user);

    const candidates = await this.loadCandidatePlaces(dto);
    if (candidates.length === 0) {
      throw new NotFoundException('Vivu chưa có đủ dữ liệu địa danh phù hợp để tạo lịch trình.');
    }

    const allowedSlugs = new Set(candidates.map((place) => place.slug));
    const prompt = buildTripPlannerPrompt(dto, candidates);
    const raw = await this.gemini.generateText(prompt, {
      temperature: 0.15,
      maxOutputTokens: tripPlannerMaxOutputTokens(),
      responseMimeType: 'application/json',
    });
    const output = parseTripPlanOutput(raw, allowedSlugs);
    const placeIds = collectPlaceIds(output, candidates);

    const plan = await this.prisma.tripPlan.create({
      data: {
        userId: user?.id,
        title: output.title,
        input: dto as unknown as Prisma.InputJsonValue,
        output: output as unknown as Prisma.InputJsonValue,
        places: {
          create: placeIds.map((placeId, index) => ({ placeId, position: index })),
        },
      },
      select: { id: true, title: true, shareId: true, isPublic: true },
    });

    return {
      data: {
        id: plan.id,
        title: plan.title,
        output,
        shareId: plan.shareId,
        isPublic: plan.isPublic,
      },
    };
  }

  async listMine(userId: string) {
    const rows = await this.prisma.tripPlan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        input: true,
        output: true,
        shareId: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return { data: rows };
  }

  async getMine(userId: string, id: string) {
    const row = await this.prisma.tripPlan.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        title: true,
        input: true,
        output: true,
        shareId: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!row) throw new NotFoundException('Không tìm thấy lịch trình.');
    if (row.userId !== userId) throw new ForbiddenException('Bạn không có quyền xem lịch trình này.');
    return { data: row };
  }

  async share(userId: string, id: string) {
    const plan = await this.prisma.tripPlan.findUnique({
      where: { id },
      select: { id: true, userId: true, title: true, shareId: true, isPublic: true },
    });
    if (!plan) throw new NotFoundException('Không tìm thấy lịch trình.');
    if (plan.userId !== userId) throw new ForbiddenException('Bạn không có quyền chia sẻ lịch trình này.');

    if (plan.shareId && plan.isPublic) {
      return { data: { id: plan.id, title: plan.title, shareId: plan.shareId, isPublic: true } };
    }

    const shareId = plan.shareId ?? (await this.createUniqueShareId());
    const updated = await this.prisma.tripPlan.update({
      where: { id },
      data: { shareId, isPublic: true },
      select: { id: true, title: true, shareId: true, isPublic: true },
    });
    return { data: updated };
  }

  async unshare(userId: string, id: string) {
    const plan = await this.prisma.tripPlan.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
    if (!plan) throw new NotFoundException('Không tìm thấy lịch trình.');
    if (plan.userId !== userId) throw new ForbiddenException('Bạn không có quyền tắt chia sẻ lịch trình này.');

    const updated = await this.prisma.tripPlan.update({
      where: { id },
      data: { shareId: null, isPublic: false },
      select: { id: true, title: true, shareId: true, isPublic: true },
    });
    return { data: updated };
  }

  async getShared(shareId: string) {
    const row = await this.prisma.tripPlan.findFirst({
      where: { shareId, isPublic: true },
      select: {
        id: true,
        title: true,
        output: true,
        shareId: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!row) throw new NotFoundException('Không tìm thấy lịch trình chia sẻ.');
    return { data: row };
  }

  async saveToCollection(userId: string, id: string) {
    const plan = await this.prisma.tripPlan.findUnique({
      where: { id },
      include: { places: { orderBy: { position: 'asc' }, include: { place: true } } },
    });
    if (!plan) throw new NotFoundException('Không tìm thấy lịch trình.');
    if (plan.userId !== userId) throw new ForbiddenException('Bạn không có quyền lưu lịch trình này.');

    const collection = await this.prisma.collection.create({
      data: {
        userId,
        name: plan.title,
        description: 'Tạo từ Lịch trình AI của Vivu.',
        items: {
          create: plan.places.map((item, index) => ({
            placeId: item.placeId,
            position: index,
            note: `Từ lịch trình AI: ${plan.title}`,
          })),
        },
      },
      include: { _count: { select: { items: true } } },
    });
    return {
      data: {
        id: collection.id,
        name: collection.name,
        itemsCount: collection._count.items,
      },
    };
  }

  async loadCandidatePlaces(dto: GenerateTripPlanDto) {
    const where: Prisma.PlaceWhereInput = {
      status: 'published',
      province: { equals: PUBLIC_PROVINCE, mode: 'insensitive' },
      OR: [{ heroImageUrl: { not: null } }, { heroImageS3Key: { not: null } }, { lat: { not: null } }],
    };

    const areaKeywords = dto.area && dto.area !== 'all' ? AREA_KEYWORDS[dto.area] : undefined;
    if (areaKeywords?.length) {
      where.AND = [
        {
          OR: areaKeywords.flatMap((keyword) => [
            { titleVi: { contains: keyword, mode: 'insensitive' } },
            { titleEn: { contains: keyword, mode: 'insensitive' } },
            { address: { contains: keyword, mode: 'insensitive' } },
            { aliases: { has: keyword } },
          ]),
        },
      ];
    }

    const maxCandidates = (() => {
      const parsed = Number(process.env.TRIP_PLANNER_MAX_CANDIDATES);
      return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 40;
    })();

    return this.prisma.place.findMany({
      where,
      orderBy: [{ isAiReady: 'desc' }, { updatedAt: 'desc' }],
      take: maxCandidates,
      include: {
        region: true,
        categories: { include: { category: true } },
      },
    });
  }

  private async createUniqueShareId(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const shareId = randomBytes(12).toString('base64url');
      const existing = await this.prisma.tripPlan.findUnique({ where: { shareId } });
      if (!existing) return shareId;
    }
    return `${randomBytes(18).toString('base64url')}`;
  }
}

function buildTripPlannerPrompt(dto: GenerateTripPlanDto, places: CandidatePlace[]): string {
  const placeContext = places.map((place) => ({
    slug: place.slug,
    titleVi: place.titleVi,
    titleEn: place.titleEn,
    summary: place.summaryVi ?? place.summaryEn,
    address: place.address,
    geo: place.lat !== null && place.lng !== null ? { lat: place.lat, lng: place.lng } : null,
    categories: place.categories.map((item) => item.category.slug),
    isAiReady: place.isAiReady,
  }));

  return [
    'Bạn là chuyên gia lập lịch trình du lịch cho Vivu.',
    'Chỉ dùng địa danh trong danh sách VIVU_PLACES. Không tự thêm địa danh ngoài danh sách.',
    'Không bịa giá vé, giờ mở cửa, số điện thoại, địa chỉ chi tiết nếu dữ liệu không có.',
    'Nếu thiếu dữ liệu, điền missingDataNote bằng câu bắt đầu với "Vivu chưa có đủ dữ liệu".',
    'Trả về JSON hợp lệ, không markdown, không giải thích ngoài JSON.',
    'Schema bắt buộc:',
    '{"title":string,"summary":string,"days":[{"day":number,"theme":string,"items":[{"timeOfDay":"morning|noon|afternoon|evening","placeName":string,"placeSlug":string|null,"reason":string,"suggestedDuration":string,"travelNote":string,"tips":string[]}],"foodSuggestions":string[],"notes":string[]}],"generalTips":string[],"missingDataNote":string|null}',
    'Return exactly one JSON object matching the schema. The root must be an object with a days array, not a top-level array.',
    '',
    `LANGUAGE: ${dto.locale ?? 'vi'}`,
    `INPUT: ${JSON.stringify(dto)}`,
    `VIVU_PLACES: ${JSON.stringify(placeContext)}`,
  ].join('\n');
}

function tripPlannerMaxOutputTokens(): number {
  const parsed = Number(process.env.TRIP_PLANNER_MAX_OUTPUT_TOKENS);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 3200;
}

function collectPlaceIds(output: TripPlanOutput, places: CandidatePlace[]): string[] {
  const idBySlug = new Map(places.map((place) => [place.slug, place.id]));
  const ids: string[] = [];
  for (const day of output.days) {
    for (const item of day.items) {
      if (!item.placeSlug) continue;
      const id = idBySlug.get(item.placeSlug);
      if (id && !ids.includes(id)) ids.push(id);
    }
  }
  return ids;
}
