import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class S3Service {
  private readonly bucket?: string;
  private readonly expiresIn: number;
  private readonly cacheTtlMs: number;
  private readonly maxCacheEntries: number;
  private readonly serverSideEncryption?: 'AES256';
  private readonly client: S3Client;
  private readonly presignedUrlCache = new Map<string, { url: string; expiresAt: number }>();
  private readonly pendingPresignedUrls = new Map<string, Promise<string>>();

  constructor(config: ConfigService) {
    const region = config.get<string>('AWS_REGION') ?? 'ap-southeast-1';
    const accessKeyId = config.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('AWS_SECRET_ACCESS_KEY');
    this.bucket = config.get<string>('AWS_BUCKET_NAME');
    this.expiresIn = positiveInteger(config.get<string>('S3_PRESIGNED_EXPIRES_IN'), 3600);
    const refreshBeforeSeconds = Math.min(60, Math.max(1, Math.floor(this.expiresIn / 10)));
    this.cacheTtlMs = Math.max(0, this.expiresIn - refreshBeforeSeconds) * 1000;
    this.maxCacheEntries = nonNegativeInteger(
      config.get<string>('S3_PRESIGNED_CACHE_MAX_ENTRIES'),
      2000,
    );
    this.serverSideEncryption =
      (config.get<string>('S3_SERVER_SIDE_ENCRYPTION') ?? 'AES256') === 'AES256'
        ? 'AES256'
        : undefined;
    this.client = new S3Client({
      region,
      credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
    });
  }

  assertConfigured(): void {
    if (!this.bucket) {
      throw new ServiceUnavailableException('AI configuration is missing: AWS_BUCKET_NAME');
    }
  }

  async getPresignedGetUrl(s3Key: string): Promise<string> {
    this.assertConfigured();
    const key = normalizeS3Key(s3Key);
    const now = Date.now();
    const cached = this.presignedUrlCache.get(key);
    if (cached && cached.expiresAt > now) return cached.url;

    const pending = this.pendingPresignedUrls.get(key);
    if (pending) return pending;

    const signing = getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: this.expiresIn },
    )
      .then((url) => {
        if (this.cacheTtlMs > 0 && this.maxCacheEntries > 0) {
          this.prunePresignedUrlCache(now);
          this.presignedUrlCache.set(key, { url, expiresAt: now + this.cacheTtlMs });
        }
        return url;
      })
      .finally(() => {
        this.pendingPresignedUrls.delete(key);
      });

    this.pendingPresignedUrls.set(key, signing);
    return signing;
  }

  async uploadTemporaryImage(
    buffer: Buffer,
    contentType: string,
  ): Promise<{ s3Key: string; presignedUrl: string }> {
    this.assertConfigured();
    const extension =
      contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
    const s3Key = `vivu/ai/temp/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType,
        ...(this.serverSideEncryption ? { ServerSideEncryption: this.serverSideEncryption } : {}),
      }),
    );
    return {
      s3Key,
      presignedUrl: await this.getPresignedGetUrl(s3Key),
    };
  }

  private prunePresignedUrlCache(now: number): void {
    for (const [key, value] of this.presignedUrlCache) {
      if (value.expiresAt <= now) this.presignedUrlCache.delete(key);
    }

    while (this.presignedUrlCache.size >= this.maxCacheEntries) {
      const oldestKey = this.presignedUrlCache.keys().next().value as string | undefined;
      if (!oldestKey) break;
      this.presignedUrlCache.delete(oldestKey);
    }
  }
}

function normalizeS3Key(value: string): string {
  if (!value.startsWith('s3://')) return value.replace(/^\/+/, '');
  const withoutScheme = value.slice(5);
  const slash = withoutScheme.indexOf('/');
  return slash >= 0 ? withoutScheme.slice(slash + 1) : withoutScheme;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function nonNegativeInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
}
