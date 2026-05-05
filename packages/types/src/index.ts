export type Locale = 'vi' | 'en';

export type UserRole = 'user' | 'editor' | 'admin';

export type PlaceStatus = 'draft' | 'published' | 'archived';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Region {
  id: string;
  slug: string;
  nameVi: string;
  nameEn: string;
  parentId: string | null;
}

export interface Category {
  id: string;
  slug: string;
  nameVi: string;
  nameEn: string;
  icon: string | null;
}

export interface Place {
  id: string;
  slug: string;
  titleVi: string;
  titleEn: string | null;
  summaryVi: string | null;
  summaryEn: string | null;
  descriptionVi: string | null;
  descriptionEn: string | null;
  regionId: string;
  address: string | null;
  geo: GeoPoint | null;
  bestSeasons: string[];
  status: PlaceStatus;
  heroImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
}
