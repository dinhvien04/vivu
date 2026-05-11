import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from 'cloudinary';

export interface SignedUploadParams {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId?: string;
  uploadUrl: string;
}

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
   * Generate signed parameters for a direct browser upload to Cloudinary.
   * The frontend POSTs the file (along with these params) to `uploadUrl`,
   * receives a `secure_url` + `public_id`, then sends those to our API.
   *
   * Why direct upload: avoids the file ever touching our server (saves
   * bandwidth + memory) and keeps the API_SECRET on the backend.
   */
  signUploadParams(opts: { folder?: string; publicId?: string } = {}): SignedUploadParams {
    if (!this.configured) {
      throw new Error('Cloudinary not configured. Set CLOUDINARY_URL.');
    }
    const cfg = cloudinary.config();
    if (!cfg.cloud_name || !cfg.api_key || !cfg.api_secret) {
      throw new Error('Cloudinary missing cloud_name / api_key / api_secret.');
    }
    const folder = opts.folder ?? 'vivu/places';
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign: Record<string, string | number> = { folder, timestamp };
    if (opts.publicId) paramsToSign.public_id = opts.publicId;
    const signature = cloudinary.utils.api_sign_request(paramsToSign, cfg.api_secret);
    return {
      cloudName: cfg.cloud_name,
      apiKey: cfg.api_key,
      timestamp,
      signature,
      folder,
      publicId: opts.publicId,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cfg.cloud_name}/image/upload`,
    };
  }

  /**
   * Delete an asset from Cloudinary by public_id. Best-effort: errors are
   * swallowed so a botched cleanup doesn't fail the DB delete.
   */
  async destroy(publicId: string): Promise<void> {
    if (!this.configured) return;
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (e) {
      this.logger.warn(`Failed to delete Cloudinary asset ${publicId}: ${String(e)}`);
    }
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
