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

export interface Photo {
  id: string;
  url: string;
  publicId: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  position: number;
  isCover: boolean;
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
  region?: Region;
  address: string | null;
  geo: GeoPoint | null;
  bestSeasons: string[];
  status: PlaceStatus;
  heroImageUrl: string | null;
  photos?: Photo[];
  categories?: Category[];
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
