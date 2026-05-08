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
  /** Optional rating summary aggregated from visible reviews. */
  rating?: PlaceRatingSummary;
  createdAt: string;
  updatedAt: string;
}

export type ReviewStatus = 'visible' | 'hidden' | 'reported';

export interface ReviewAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface Review {
  id: string;
  placeId: string;
  rating: number;
  content: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  user: ReviewAuthor;
  /** Optional preview of the place this review belongs to (admin / me views). */
  place?: {
    id: string;
    slug: string;
    titleVi: string;
  };
}

export interface PlaceRatingSummary {
  count: number;
  /** Average from 1.00 to 5.00 (rounded to 2 decimals). 0 if no reviews. */
  average: number;
}

export interface CollectionItem {
  placeId: string;
  position: number;
  note: string | null;
  /** Place preview attached when listing items. */
  place?: Place;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  coverUrl: string | null;
  /** Number of places saved in this collection. */
  itemsCount: number;
  /** Optional list of items (only present on detail responses). */
  items?: CollectionItem[];
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
