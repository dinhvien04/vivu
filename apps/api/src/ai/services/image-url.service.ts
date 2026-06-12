import { Injectable } from '@nestjs/common';
import { S3Service } from '../../storage/s3.service';

@Injectable()
export class ImageUrlService {
  constructor(private readonly s3: S3Service) {}

  async resolve(s3Key?: string): Promise<string | undefined> {
    if (!s3Key) return undefined;
    try {
      return await this.s3.getPresignedGetUrl(s3Key);
    } catch {
      return undefined;
    }
  }
}
