/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();
const SHOULD_WRITE = process.argv.includes('--write');
const OVERRIDES_ONLY = process.argv.includes('--overrides-only');
const REQUEST_DELAY_MS = 1500;
const SEARCH_BOUNDS = {
  minLat: 12.75,
  maxLat: 15.85,
  minLng: 107.25,
  maxLng: 109.55,
};
const MIN_MATCH_SCORE = 0.62;
const QUERY_CONTEXTS = [
  'Gia Lai, Vietnam',
  'Binh Dinh, Vietnam',
  'Quy Nhon, Binh Dinh, Vietnam',
];
const STOP_WORDS = new Set([
  'an',
  'ba',
  'bien',
  'chua',
  'co',
  'da',
  'den',
  'di',
  'dinh',
  'doi',
  'hon',
  'khu',
  'lang',
  'mien',
  'mot',
  'nha',
  'nui',
  'suoi',
  'thac',
  'thap',
  'the',
  'tich',
  'tu',
  'va',
]);

interface NominatimResult {
  osm_id?: number;
  lat: string;
  lon: string;
  display_name: string;
  importance?: number;
}

interface PlaceToGeocode {
  slug: string;
  titleVi: string;
  aliases: string[];
}

interface ScoredResult extends NominatimResult {
  score: number;
  query: string;
}

interface CoordinateOverride {
  lat: number;
  lng: number;
  source?: string;
}

loadEnvFile();

async function main(): Promise<void> {
  const overrides = loadCoordinateOverrides();
  const places = await prisma.place.findMany({
    where: {
      status: 'published',
      province: { equals: 'Gia Lai', mode: 'insensitive' },
      OR: [{ lat: null }, { lng: null }],
    },
    select: {
      id: true,
      slug: true,
      titleVi: true,
      aliases: true,
    },
    orderBy: { titleVi: 'asc' },
  });

  let matched = 0;
  for (const [index, place] of places.entries()) {
    const override = overrides[place.slug];
    if (override && isInsideSearchBounds(override.lat, override.lng)) {
      matched += 1;
      console.log(
        `[geo] ${place.slug} -> ${override.lat.toFixed(6)}, ${override.lng.toFixed(
          6,
        )} | override${override.source ? ` | ${override.source}` : ''}`,
      );

      if (SHOULD_WRITE) {
        await prisma.place.update({
          where: { id: place.id },
          data: {
            lat: override.lat,
            lng: override.lng,
          },
        });
      }

      continue;
    }

    if (OVERRIDES_ONLY) continue;

    const result = await geocode(place);
    if (!result) {
      console.log(`[geo] miss ${place.slug} (${place.titleVi})`);
      continue;
    }

    const lat = Number(result.lat);
    const lng = Number(result.lon);
    matched += 1;
    console.log(
      `[geo] ${place.slug} -> ${lat.toFixed(6)}, ${lng.toFixed(6)} | score=${result.score.toFixed(
        2,
      )} | ${result.display_name}`,
    );

    if (SHOULD_WRITE) {
      await prisma.place.update({
        where: { id: place.id },
        data: {
          lat,
          lng,
        },
      });
    }

    if (index < places.length - 1) await delay(REQUEST_DELAY_MS);
  }

  console.log(
    `[geo] ${SHOULD_WRITE ? 'Updated' : 'Dry run matched'} ${matched}/${places.length} places.`,
  );
}

async function geocode(place: PlaceToGeocode): Promise<ScoredResult | null> {
  const candidates = buildQueries(place);
  const seen = new Set<string>();
  const scored: ScoredResult[] = [];

  for (const query of candidates) {
    const results = await searchNominatim(query);
    for (const result of results) {
      const key = `${result.osm_id ?? ''}:${result.lat}:${result.lon}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const lat = Number(result.lat);
      const lng = Number(result.lon);
      if (!isInsideSearchBounds(lat, lng)) continue;

      const score = scoreResult(place, result);
      if (score < MIN_MATCH_SCORE) continue;
      scored.push({ ...result, score, query });
    }

    if (scored.some((result) => result.score >= 0.95)) break;
    await delay(REQUEST_DELAY_MS);
  }

  return (
    scored.sort(
      (a, b) => b.score - a.score || (b.importance ?? 0) - (a.importance ?? 0),
    )[0] ?? null
  );
}

async function searchNominatim(query: string): Promise<NominatimResult[]> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    limit: '5',
    countrycodes: 'vn',
    addressdetails: '1',
    q: query,
  });
  const response = await fetchWithRetry(
    `https://nominatim.openstreetmap.org/search?${params}`,
    3,
  );
  if (!response.ok) {
    throw new Error(`Nominatim returned ${response.status} for ${query}`);
  }

  return (await response.json()) as NominatimResult[];
}

function buildQueries(place: PlaceToGeocode): string[] {
  const names = new Set<string>([place.titleVi]);
  for (const alias of place.aliases) {
    const cleaned = alias.replace(/_/g, ' ').trim();
    if (cleaned && !/^[A-Z0-9_]+$/.test(alias)) names.add(cleaned);
  }

  const queries = new Set<string>();
  for (const name of names) {
    queries.add(`${name}, Vietnam`);
    for (const context of QUERY_CONTEXTS) {
      queries.add(`${name}, ${context}`);
    }
  }
  return [...queries];
}

function scoreResult(place: PlaceToGeocode, result: NominatimResult): number {
  const normalizedName = normalize(place.titleVi);
  const haystack = normalize(result.display_name);
  const haystackTokens = new Set(tokenize(result.display_name, { includeStopWords: true }));
  const nameTokens = tokenize(place.titleVi);
  const exactNameMatch = haystack.includes(normalizedName);

  if (nameTokens.length < 2 && !exactNameMatch) return 0;

  const matchedTokens = nameTokens.filter((token) => haystackTokens.has(token)).length;
  const tokenScore = matchedTokens / nameTokens.length;
  const regionBonus = /(gia lai|binh dinh|quy nhon|pleiku)/.test(haystack) ? 0.15 : 0;
  const exactBonus = exactNameMatch ? 0.25 : 0;
  return Math.min(1, tokenScore + regionBonus + exactBonus);
}

async function fetchWithRetry(url: string, attempts: number): Promise<Response> {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'VivuTravel/1.0 (Gia Lai destination coordinate sync)',
        'Accept-Language': 'vi',
      },
    });
    if (response.status !== 429 || attempt === attempts) return response;
    await delay(attempt * 5000);
  }
  throw new Error('Nominatim request failed');
}

function isInsideSearchBounds(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= SEARCH_BOUNDS.minLat &&
    lat <= SEARCH_BOUNDS.maxLat &&
    lng >= SEARCH_BOUNDS.minLng &&
    lng <= SEARCH_BOUNDS.maxLng
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/gi, 'd')
    .toLocaleLowerCase('vi-VN')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function tokenize(value: string, options: { includeStopWords?: boolean } = {}): string[] {
  return normalize(value)
    .split(' ')
    .filter(
      (token) =>
        token.length >= 2 && (options.includeStopWords === true || !STOP_WORDS.has(token)),
    );
}

function loadCoordinateOverrides(): Record<string, CoordinateOverride> {
  const overridesPath = join(__dirname, 'data', 'place-coordinates.overrides.json');
  if (!existsSync(overridesPath)) return {};
  return JSON.parse(readFileSync(overridesPath, 'utf8')) as Record<string, CoordinateOverride>;
}

function loadEnvFile(): void {
  const envPath = join(process.cwd(), '.env');
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed
      .slice(separator + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

void main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
