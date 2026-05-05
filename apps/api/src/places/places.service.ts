import { Injectable } from '@nestjs/common';
import type { Paginated, Place } from '@vivu/types';
import { ListPlacesQueryDto } from './dto/list-places.query.dto';

const NOW = new Date('2026-01-01T00:00:00.000Z').toISOString();

const SEED_PLACES: Place[] = [
  {
    id: 'p_001',
    slug: 'vinh-ha-long',
    titleVi: 'Vịnh Hạ Long',
    titleEn: 'Ha Long Bay',
    summaryVi: 'Di sản thiên nhiên thế giới với hàng nghìn đảo đá vôi.',
    summaryEn: 'A UNESCO world heritage site with thousands of limestone islands.',
    descriptionVi: null,
    descriptionEn: null,
    regionId: 'r_quang_ninh',
    address: 'Quảng Ninh',
    geo: { lat: 20.9101, lng: 107.1839 },
    bestSeasons: ['spring', 'autumn'],
    status: 'published',
    heroImageUrl: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'p_002',
    slug: 'da-lat',
    titleVi: 'Đà Lạt',
    titleEn: 'Da Lat',
    summaryVi: 'Thành phố ngàn hoa, khí hậu mát mẻ quanh năm.',
    summaryEn: 'The city of a thousand flowers with cool weather year-round.',
    descriptionVi: null,
    descriptionEn: null,
    regionId: 'r_lam_dong',
    address: 'Lâm Đồng',
    geo: { lat: 11.9404, lng: 108.4583 },
    bestSeasons: ['winter', 'spring'],
    status: 'published',
    heroImageUrl: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'p_003',
    slug: 'pho-co-hoi-an',
    titleVi: 'Phố cổ Hội An',
    titleEn: 'Hoi An Ancient Town',
    summaryVi: 'Phố cổ ven sông với đèn lồng và kiến trúc giao thoa Đông – Tây.',
    summaryEn: 'A riverside ancient town famous for lanterns and east-west architecture.',
    descriptionVi: null,
    descriptionEn: null,
    regionId: 'r_quang_nam',
    address: 'Quảng Nam',
    geo: { lat: 15.8801, lng: 108.338 },
    bestSeasons: ['spring', 'autumn'],
    status: 'published',
    heroImageUrl: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

@Injectable()
export class PlacesService {
  list(query: ListPlacesQueryDto): Paginated<Place> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const q = query.q?.toLowerCase().trim();

    let filtered = SEED_PLACES;
    if (q) {
      filtered = filtered.filter(
        (p) =>
          p.titleVi.toLowerCase().includes(q) ||
          (p.titleEn?.toLowerCase().includes(q) ?? false) ||
          (p.summaryVi?.toLowerCase().includes(q) ?? false),
      );
    }
    if (query.region) {
      filtered = filtered.filter((p) => p.regionId === query.region);
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return { data, meta: { page, pageSize, total } };
  }

  findBySlug(slug: string): Place | undefined {
    return SEED_PLACES.find((p) => p.slug === slug);
  }
}
