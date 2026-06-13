import type { Place } from '@vivu/types';

export type PlaceWithImage = Place & { heroImageUrl: string };

export function hasPlaceImage(place: Place | null | undefined): place is PlaceWithImage {
  return Boolean(place?.heroImageUrl?.trim());
}
