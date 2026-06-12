/* eslint-disable no-console */
import { GetObjectCommand, ListObjectsV2Command, S3Client, type _Object } from '@aws-sdk/client-s3';
import { PrismaClient, type PlaceStatus } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Readable } from 'stream';

const DOC_DIRS = ['docx', 'docs', 'doc', 'txt', 'text'];
const IMAGE_DIRS = ['image', 'images', 'img'];
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

loadEnvFile();

const prisma = new PrismaClient();

async function main() {
  const bucket = requireEnv('AWS_BUCKET_NAME');
  const client = new S3Client({
    region: process.env.AWS_REGION ?? 'ap-southeast-1',
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  });
  const status = normalizeStatus(process.env.SYNC_PLACE_STATUS);
  const region = await ensureGiaLaiRegion();
  const locationKeys = await listTopLevelPrefixes(client, bucket);

  let synced = 0;
  for (const locationKey of locationKeys) {
    const objects = await listObjects(client, bucket, `${locationKey}/`);
    const imageKeys = findImageKeys(locationKey, objects);
    const textKeys = findTextKeys(locationKey, objects);
    if (imageKeys.length === 0 && textKeys.length === 0) {
      console.log(`[sync] skip ${locationKey} (no known text/image assets)`);
      continue;
    }
    const descriptionKey = findDescriptionKey(textKeys);
    const description = descriptionKey
      ? normalizeDescription(await getObjectText(client, bucket, descriptionKey))
      : null;
    const heroImageS3Key = imageKeys[0] ?? null;
    const slug = keyToSlug(locationKey);
    const name = keyToTitle(locationKey);

    const place = await prisma.place.upsert({
      where: { locationKey },
      create: {
        locationKey,
        slug,
        titleVi: name,
        summaryVi: description ? firstSentence(description) : null,
        descriptionVi: description,
        regionId: region.id,
        province: 'Gia Lai',
        aliases: [locationKey, name],
        status,
        heroImageS3Key,
        qdrantPlaceSlug: slug,
        isAiReady: textKeys.length > 0 || imageKeys.length > 0,
      },
      update: {
        titleVi: name,
        summaryVi: description ? firstSentence(description) : undefined,
        descriptionVi: description ?? undefined,
        regionId: region.id,
        province: 'Gia Lai',
        aliases: [locationKey, name],
        status,
        heroImageS3Key,
        qdrantPlaceSlug: slug,
        isAiReady: textKeys.length > 0 || imageKeys.length > 0,
      },
      select: { id: true, slug: true },
    });

    for (const [position, s3Key] of imageKeys.entries()) {
      await prisma.photo.upsert({
        where: { placeId_s3Key: { placeId: place.id, s3Key } },
        create: {
          placeId: place.id,
          url: `s3://${bucket}/${s3Key}`,
          s3Key,
          alt: name,
          position,
          isCover: position === 0,
        },
        update: {
          url: `s3://${bucket}/${s3Key}`,
          alt: name,
          position,
          isCover: position === 0,
        },
      });
    }

    synced += 1;
    console.log(
      `[sync] ${locationKey} -> ${place.slug} (${textKeys.length} text, ${imageKeys.length} images)`,
    );
  }

  console.log(`[sync] Done. Synced ${synced} locations from s3://${bucket}`);
}

async function ensureGiaLaiRegion() {
  const parent = await prisma.region.upsert({
    where: { slug: 'tay-nguyen' },
    create: { slug: 'tay-nguyen', nameVi: 'Tay Nguyen', nameEn: 'Central Highlands' },
    update: {},
    select: { id: true },
  });
  return prisma.region.upsert({
    where: { slug: 'gia-lai' },
    create: {
      slug: 'gia-lai',
      nameVi: 'Gia Lai',
      nameEn: 'Gia Lai',
      parentId: parent.id,
    },
    update: {
      nameVi: 'Gia Lai',
      nameEn: 'Gia Lai',
      parentId: parent.id,
    },
    select: { id: true },
  });
}

async function listTopLevelPrefixes(client: S3Client, bucket: string): Promise<string[]> {
  const prefixes = new Set<string>();
  let continuationToken: string | undefined;
  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Delimiter: '/',
        ContinuationToken: continuationToken,
      }),
    );
    for (const prefix of response.CommonPrefixes ?? []) {
      const key = prefix.Prefix?.replace(/\/$/, '');
      if (key) prefixes.add(key);
    }
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return [...prefixes].sort((a, b) => a.localeCompare(b));
}

async function listObjects(client: S3Client, bucket: string, prefix: string): Promise<_Object[]> {
  const objects: _Object[] = [];
  let continuationToken: string | undefined;
  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );
    objects.push(
      ...(response.Contents ?? []).filter((item) => item.Key && !item.Key.endsWith('/')),
    );
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);
  return objects;
}

function findImageKeys(locationKey: string, objects: _Object[]): string[] {
  return objects
    .map((item) => item.Key)
    .filter((key): key is string => Boolean(key))
    .filter((key) => isInKnownDir(locationKey, key, IMAGE_DIRS))
    .filter((key) => IMAGE_EXTENSIONS.has(extension(key)))
    .sort((a, b) => a.localeCompare(b));
}

function findTextKeys(locationKey: string, objects: _Object[]): string[] {
  return objects
    .map((item) => item.Key)
    .filter((key): key is string => Boolean(key))
    .filter((key) => isInKnownDir(locationKey, key, DOC_DIRS))
    .filter((key) => extension(key) === '.txt')
    .sort((a, b) => a.localeCompare(b));
}

function findDescriptionKey(textKeys: string[]): string | undefined {
  return (
    textKeys.find((key) => key.split('/').at(-1)?.toLowerCase() === 'overview.txt') ?? textKeys[0]
  );
}

async function getObjectText(client: S3Client, bucket: string, key: string): Promise<string> {
  const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const body = response.Body;
  if (!body) return '';
  if (body instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString('utf8');
  }
  return await body.transformToString();
}

function isInKnownDir(locationKey: string, key: string, dirs: string[]): boolean {
  return dirs.some((dir) => key.toLowerCase().startsWith(`${locationKey.toLowerCase()}/${dir}/`));
}

function extension(key: string): string {
  const filename = key.split('/').at(-1) ?? '';
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot).toLowerCase() : '';
}

function keyToSlug(locationKey: string): string {
  return locationKey
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function keyToTitle(locationKey: string): string {
  return locationKey
    .split('_')
    .filter(Boolean)
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function normalizeDescription(value: string): string | null {
  const normalized = value.replace(/\r\n/g, '\n').trim();
  return normalized ? normalized : null;
}

function firstSentence(value: string): string {
  const first = value.split(/\n{2,}|(?<=[.!?])\s+/).find(Boolean) ?? value;
  return first.slice(0, 500);
}

function normalizeStatus(value?: string): PlaceStatus {
  return value === 'draft' || value === 'archived' ? value : 'published';
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
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
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
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
