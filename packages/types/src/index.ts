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
  s3Key: string | null;
  publicId: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  position: number;
  isCover: boolean;
}

export interface Place {
  id: string;
  locationKey: string | null;
  slug: string;
  titleVi: string;
  titleEn: string | null;
  summaryVi: string | null;
  summaryEn: string | null;
  descriptionVi: string | null;
  descriptionEn: string | null;
  regionId: string;
  region?: Region;
  province: string;
  aliases: string[];
  address: string | null;
  geo: GeoPoint | null;
  bestSeasons: string[];
  status: PlaceStatus;
  heroImageUrl: string | null;
  heroImageS3Key: string | null;
  qdrantPlaceSlug: string | null;
  isAiReady: boolean;
  photos?: Photo[];
  categories?: Category[];
  /** Optional rating summary aggregated from visible reviews. */
  rating?: PlaceRatingSummary;
  createdAt: string;
  updatedAt: string;
}

export interface PlaceImage {
  id: string;
  s3Key: string;
  url: string;
  alt: string | null;
  position: number;
  isCover: boolean;
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

export interface QuestionAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface Answer {
  id: string;
  questionId: string;
  content: string;
  createdAt: string;
  user: QuestionAuthor;
}

export interface Question {
  id: string;
  placeId: string;
  content: string;
  createdAt: string;
  user: QuestionAuthor;
  /** Optional preview of the place this question belongs to. */
  place?: {
    id: string;
    slug: string;
    titleVi: string;
  };
  /** Total number of answers — included in list responses. */
  answersCount: number;
  /** Detailed list of answers — only present on detail responses. */
  answers?: Answer[];
}

export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export type TripTimeOfDay = 'morning' | 'noon' | 'afternoon' | 'evening';

export interface TripPlanItem {
  timeOfDay: TripTimeOfDay;
  placeName: string;
  placeSlug: string | null;
  reason: string;
  suggestedDuration: string;
  travelNote: string;
  tips: string[];
}

export interface TripPlanDay {
  day: number;
  theme: string;
  items: TripPlanItem[];
  foodSuggestions: string[];
  notes: string[];
}

export interface TripPlanOutput {
  title: string;
  summary: string;
  days: TripPlanDay[];
  generalTips: string[];
  missingDataNote: string | null;
}

export interface TripPlan {
  id: string;
  title: string;
  input: unknown;
  output: TripPlanOutput;
  createdAt: string;
  updatedAt: string;
}

export type LeadSource = 'place_detail' | 'ai_chat' | 'trip_planner' | 'home' | 'other';
export type LeadStatus = 'new' | 'contacted' | 'planning' | 'booked' | 'cancelled' | 'spam';

export interface Lead {
  id: string;
  name: string;
  phoneOrZalo: string;
  email: string | null;
  interestedPlaceSlug: string | null;
  interestedPlaceName: string | null;
  area: string | null;
  travelDate: string | null;
  peopleCount: number | null;
  budget: string | null;
  note: string | null;
  source: LeadSource;
  status: LeadStatus;
  internalNote: string | null;
  estimatedValue: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DataReportType =
  | 'wrong_image'
  | 'wrong_coordinates'
  | 'wrong_description'
  | 'missing_info'
  | 'other';

export type DataReportStatus = 'new' | 'reviewed' | 'resolved' | 'rejected';

export interface DataReport {
  id: string;
  placeSlug: string;
  type: DataReportType;
  message: string;
  contact: string | null;
  status: DataReportStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
}
