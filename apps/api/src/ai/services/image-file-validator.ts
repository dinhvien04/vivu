import { BadRequestException } from '@nestjs/common';

export type SupportedImageContentType = 'image/jpeg' | 'image/png' | 'image/webp';

export function detectImageContentType(buffer: Buffer): SupportedImageContentType | null {
  if (isJpeg(buffer)) return 'image/jpeg';
  if (isPng(buffer)) return 'image/png';
  if (isWebp(buffer)) return 'image/webp';
  return null;
}

export function assertValidImageBuffer(buffer: Buffer): SupportedImageContentType {
  const contentType = detectImageContentType(buffer);
  if (!contentType) {
    throw new BadRequestException('Tệp ảnh không hợp lệ.');
  }
  return contentType;
}

function isJpeg(buffer: Buffer): boolean {
  return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

function isPng(buffer: Buffer): boolean {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return signature.every((byte, index) => buffer[index] === byte);
}

function isWebp(buffer: Buffer): boolean {
  return (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  );
}
