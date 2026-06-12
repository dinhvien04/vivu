import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class S3Service {
  private readonly bucket?: string;
  private readonly expiresIn: number;
  private readonly client: S3Client;

  constructor(config: ConfigService) {
    const region = config.get<string>('AWS_REGION') ?? 'ap-southeast-1';
    const accessKeyId = config.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('AWS_SECRET_ACCESS_KEY');
    this.bucket = config.get<string>('AWS_BUCKET_NAME');
    this.expiresIn = Number(config.get<string>('S3_PRESIGNED_EXPIRES_IN') ?? 3600);
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
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: normalizeS3Key(s3Key) }),
      { expiresIn: this.expiresIn },
    );
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
      }),
    );
    return {
      s3Key,
      presignedUrl: await this.getPresignedGetUrl(s3Key),
    };
  }
}

function normalizeS3Key(value: string): string {
  if (!value.startsWith('s3://')) return value.replace(/^\/+/, '');
  const withoutScheme = value.slice(5);
  const slash = withoutScheme.indexOf('/');
  return slash >= 0 ? withoutScheme.slice(slash + 1) : withoutScheme;
}
