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
