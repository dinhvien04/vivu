'use client';

import { useRef, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icon';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif';
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
}

interface SignResponse {
  data: {
    cloudName: string;
    apiKey: string;
    timestamp: number;
    signature: string;
    folder: string;
    publicId?: string;
    uploadUrl: string;
  };
}

async function fetchSignParams(
  bearer: string,
  publicId?: string,
  folder?: string,
): Promise<SignResponse['data']> {
  const res = await fetch('/api/admin/media/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bearer}` },
    body: JSON.stringify({ folder, publicId }),
  });
  const json = (await res.json().catch(() => null)) as SignResponse | { message?: string } | null;
  if (!res.ok) {
    const msg = (json as { message?: string })?.message ?? 'Không lấy được chữ ký upload';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return (json as SignResponse).data;
}

interface Props {
  /** Called after a successful upload with the asset metadata. */
  onUploaded: (img: UploadedImage) => void;
  /** Optional folder override (default: vivu/places). */
  folder?: string;
  /** Optional public_id override. */
  publicId?: string;
  /** Existing image URL to render as the preview. */
  currentUrl?: string | null;
  /** Compact variant — used inline next to other controls. */
  compact?: boolean;
  /** Visible label on the trigger button. */
  buttonLabel?: string;
}

export function CloudinaryUpload({
  onUploaded,
  folder,
  publicId,
  currentUrl,
  compact = false,
  buttonLabel = 'Tải ảnh lên',
}: Props) {
  const { getAccessToken } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleClick = (): void => {
    if (busy) return;
    inputRef.current?.click();
  };

  const handleFile = async (file: File): Promise<void> => {
    setError(null);
    if (!ACCEPT.split(',').includes(file.type)) {
      setError('Định dạng không hỗ trợ. Chấp nhận: JPG, PNG, WebP, AVIF.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`Ảnh quá lớn (${(file.size / 1024 / 1024).toFixed(1)} MB). Tối đa 10 MB.`);
      return;
    }
    setBusy(true);
    setProgress(0);
    try {
      const bearer = await getAccessToken();
      if (!bearer) throw new Error('Phiên đăng nhập đã hết hạn.');
      const sign = await fetchSignParams(bearer, publicId, folder);

      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', sign.apiKey);
      fd.append('timestamp', String(sign.timestamp));
      fd.append('signature', sign.signature);
      fd.append('folder', sign.folder);
      if (sign.publicId) fd.append('public_id', sign.publicId);

      // Use XMLHttpRequest for progress events.
      const result = await new Promise<UploadedImage>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', sign.uploadUrl);
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText) as {
                secure_url: string;
                public_id: string;
                width: number;
                height: number;
                bytes: number;
                format: string;
              };
              resolve({
                url: data.secure_url,
                publicId: data.public_id,
                width: data.width,
                height: data.height,
                bytes: data.bytes,
                format: data.format,
              });
            } catch (e) {
              reject(new Error(`Cloudinary trả về không hợp lệ: ${String(e)}`));
            }
          } else {
            let msg = `Upload thất bại (${xhr.status})`;
            try {
              const errJson = JSON.parse(xhr.responseText) as { error?: { message?: string } };
              if (errJson.error?.message) msg = errJson.error.message;
            } catch {
              // ignore
            }
            reject(new Error(msg));
          }
        };
        xhr.onerror = () => reject(new Error('Lỗi mạng khi upload.'));
        xhr.send(fd);
      });

      onUploaded(result);
      setProgress(100);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload thất bại.');
    } finally {
      setBusy(false);
      // Reset input so the same file can be re-selected.
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={compact ? 'flex flex-wrap items-center gap-3' : 'space-y-3'}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      <div className={compact ? 'flex items-center gap-3' : 'flex flex-wrap items-center gap-3'}>
        <button
          type="button"
          onClick={handleClick}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 py-2 text-label-md font-medium text-on-surface transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon name="cloud_upload" className="!text-base" />
          {busy ? `Đang tải… ${progress}%` : buttonLabel}
        </button>
        {currentUrl && !compact && (
          <span className="text-body-sm text-on-surface-variant">
            Ảnh hiện tại đã có. Tải lên để thay thế.
          </span>
        )}
      </div>
      {!compact && currentUrl && (
        <div className="overflow-hidden rounded-lg border border-outline-variant/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentUrl} alt="Ảnh hiện tại" className="h-32 w-full object-cover" />
        </div>
      )}
      {busy && progress > 0 && progress < 100 && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && (
        <p className="text-body-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
