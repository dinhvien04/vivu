import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from 'cloudinary';

export interface UploadResult {
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Wraps the Cloudinary Node SDK. Configuration is loaded from the
 * `CLOUDINARY_URL` env var (format: `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`).
 */
@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryService.name);
  private configured = false;

  onModuleInit() {
    const url = process.env.CLOUDINARY_URL;
    if (!url) {
      this.logger.warn('CLOUDINARY_URL not set — uploads will be disabled.');
      return;
    }
    // SDK auto-reads CLOUDINARY_URL on import, but we double-check + log.
    cloudinary.config({ secure: true });
    const cfg = cloudinary.config();
    this.configured = Boolean(cfg.cloud_name);
    if (this.configured) {
      this.logger.log(`Cloudinary configured for cloud "${cfg.cloud_name}".`);
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  /**
   * Upload an image from a remote URL or a local file path.
   * `publicId` controls the asset's permanent identifier inside the cloud
   * (e.g. `vivu/places/da-lat`).
   */
  async upload(source: string, publicId: string, folder = 'vivu'): Promise<UploadResult> {
    if (!this.configured) {
      throw new Error('Cloudinary not configured. Set CLOUDINARY_URL.');
    }
    const opts: UploadApiOptions = {
      public_id: publicId,
      folder,
      overwrite: true,
      resource_type: 'image',
      // Convert to a sane working copy on upload — we still apply per-request
      // transforms when the client requests the image.
      transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
    };
    const res: UploadApiResponse = await cloudinary.uploader.upload(source, opts);
    return {
      publicId: res.public_id,
      url: res.secure_url,
      width: res.width,
      height: res.height,
      format: res.format,
      bytes: res.bytes,
    };
  }

  /**
   * Build a transformed URL for an existing public_id, e.g. for thumbnails.
   * Pass `width` (and optionally `height`) to resize. Format/quality default
   * to auto for best perf.
   */
  url(publicId: string, opts: { width?: number; height?: number; crop?: string } = {}): string {
    return cloudinary.url(publicId, {
      secure: true,
      transformation: [
        {
          width: opts.width,
          height: opts.height,
          crop: opts.crop ?? 'fill',
          quality: 'auto:good',
          fetch_format: 'auto',
        },
      ],
    });
  }
}
