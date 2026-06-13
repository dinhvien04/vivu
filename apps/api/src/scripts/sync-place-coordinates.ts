/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();
const SHOULD_WRITE = process.argv.includes('--write');
const REQUEST_DELAY_MS = 1500;
const GIA_LAI_BOUNDS = {
  minLat: 12.75,
  maxLat: 15.85,
  minLng: 107.25,
  maxLng: 109.55,
};

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  importance?: number;
}

loadEnvFile();

async function main(): Promise<void> {
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
    const result = await geocode(place.titleVi);
    if (!result) {
      console.log(`[geo] miss ${place.slug} (${place.titleVi})`);
      continue;
    }

    const lat = Number(result.lat);
    const lng = Number(result.lon);
    matched += 1;
    console.log(
      `[geo] ${place.slug} -> ${lat.toFixed(6)}, ${lng.toFixed(6)} | ${result.display_name}`,
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

async function geocode(name: string): Promise<NominatimResult | null> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    limit: '5',
    countrycodes: 'vn',
    addressdetails: '1',
    q: `${name}, Gia Lai, Việt Nam`,
  });
  const response = await fetchWithRetry(
    `https://nominatim.openstreetmap.org/search?${params}`,
    3,
  );
  if (!response.ok) {
    throw new Error(`Nominatim returned ${response.status} for ${name}`);
  }

  const results = (await response.json()) as NominatimResult[];
  const normalizedName = normalize(name);
  return (
    results
      .filter((result) => isInsideGiaLai(Number(result.lat), Number(result.lon)))
      .filter((result) => result.display_name.toLocaleLowerCase('vi-VN').includes('gia lai'))
      .filter((result) => normalize(result.display_name).includes(normalizedName))
      .sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0))[0] ?? null
  );
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

function isInsideGiaLai(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= GIA_LAI_BOUNDS.minLat &&
    lat <= GIA_LAI_BOUNDS.maxLat &&
    lng >= GIA_LAI_BOUNDS.minLng &&
    lng <= GIA_LAI_BOUNDS.maxLng
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
