import { BadGatewayException } from '@nestjs/common';
import type { TripPlanDay, TripPlanItem, TripPlanOutput, TripTimeOfDay } from './trip-plan.types';

const TIMES: TripTimeOfDay[] = ['morning', 'noon', 'afternoon', 'evening'];

export function parseTripPlanOutput(raw: string, allowedSlugs: Set<string>): TripPlanOutput {
  const candidate = extractJson(raw);
  let parsed: unknown;
  try {
    parsed = parseJson(candidate);
  } catch {
    try {
      parsed = parseJson(candidate.replace(/,\s*([}\]])/g, '$1'));
    } catch {
      throw invalidFormatException();
    }
  }

  const root = normalizeRoot(parsed);
  if (!root) throw invalidFormatException();

  const days = toArray(root.days ?? root.itinerary ?? root.schedule)
    .map((day, index) => normalizeDay(day, index + 1, allowedSlugs))
    .filter((day): day is TripPlanDay => Boolean(day));

  if (days.length === 0) {
    throw new BadGatewayException('AI chưa tạo được lịch trình phù hợp. Vui lòng thử lại.');
  }

  return {
    title: toText(root.title, 'Lịch trình du lịch Gia Lai cùng Vivu'),
    summary: toText(root.summary, 'Vivu đã tạo lịch trình dựa trên dữ liệu địa danh hiện có.'),
    days,
    generalTips: toStringArray(root.generalTips).slice(0, 8),
    missingDataNote:
      typeof root.missingDataNote === 'string' && root.missingDataNote.trim()
        ? root.missingDataNote.trim()
        : null,
  };
}

function normalizeDay(
  value: unknown,
  fallbackDay: number,
  allowedSlugs: Set<string>,
): TripPlanDay | null {
  if (!isRecord(value)) return null;
  const items = toArray(value.items)
    .map((item) => normalizeItem(item, allowedSlugs))
    .filter((item): item is TripPlanItem => Boolean(item));
  if (items.length === 0) return null;

  return {
    day: toInteger(value.day, fallbackDay),
    theme: toText(value.theme, `Ngày ${fallbackDay}`),
    items,
    foodSuggestions: toStringArray(value.foodSuggestions).slice(0, 6),
    notes: toStringArray(value.notes).slice(0, 6),
  };
}

function normalizeItem(value: unknown, allowedSlugs: Set<string>): TripPlanItem | null {
  if (!isRecord(value)) return null;
  const timeOfDay = TIMES.includes(value.timeOfDay as TripTimeOfDay)
    ? (value.timeOfDay as TripTimeOfDay)
    : 'morning';
  const placeName = toText(value.placeName, '');
  if (!placeName) return null;
  const rawSlug = typeof value.placeSlug === 'string' ? value.placeSlug.trim() : '';
  return {
    timeOfDay,
    placeName,
    placeSlug: rawSlug && allowedSlugs.has(rawSlug) ? rawSlug : null,
    reason: toText(value.reason, 'Phù hợp với sở thích và dữ liệu hiện có của Vivu.'),
    suggestedDuration: toText(value.suggestedDuration, 'Khoảng 1-2 giờ'),
    travelNote: toText(value.travelNote, 'Kiểm tra thời tiết và di chuyển trước khi đi.'),
    tips: toStringArray(value.tips).slice(0, 5),
  };
}

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const balanced = extractBalancedJson(trimmed);
  if (balanced) return balanced;
  return trimmed;
}

function parseJson(candidate: string): unknown {
  const parsed = JSON.parse(candidate);
  if (typeof parsed === 'string') {
    const nested = extractJson(parsed);
    if (nested !== parsed || /^[\s[{]/.test(nested)) return parseJson(nested);
  }
  return parsed;
}

function normalizeRoot(value: unknown): Record<string, unknown> | null {
  if (isRecord(value)) return value;
  if (Array.isArray(value)) return { days: value };
  return null;
}

function extractBalancedJson(text: string): string | null {
  let best: { start: number; end: number } | null = null;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char !== '{' && char !== '[') continue;
    const end = findBalancedEnd(text, index);
    if (end === -1) continue;
    if (!best || index < best.start) best = { start: index, end };
  }
  return best ? text.slice(best.start, best.end + 1) : null;
}

function findBalancedEnd(text: string, start: number): number {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      stack.push('}');
      continue;
    }

    if (char === '[') {
      stack.push(']');
      continue;
    }

    if (char === '}' || char === ']') {
      if (stack.pop() !== char) return -1;
      if (stack.length === 0) return index;
    }
  }

  return -1;
}

function invalidFormatException(): BadGatewayException {
  return new BadGatewayException('AI chưa trả về lịch trình đúng định dạng. Vui lòng thử lại.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toStringArray(value: unknown): string[] {
  return toArray(value)
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function toInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
}
