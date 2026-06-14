const TARGET_IMAGE_BYTES = 700 * 1024;
const MAX_IMAGE_DIMENSION = 1280;
const MIN_IMAGE_DIMENSION = 480;

export async function prepareChatImage(file: File): Promise<File> {
  if (file.size <= TARGET_IMAGE_BYTES) return file;

  const bitmap = await createImageBitmap(file);
  try {
    const longestEdge = Math.max(bitmap.width, bitmap.height);
    const minimumScale = Math.min(1, MIN_IMAGE_DIMENSION / longestEdge);
    let scale = Math.min(1, MAX_IMAGE_DIMENSION / longestEdge);
    let quality = 0.82;
    let latest: Blob | null = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas is unavailable.');

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0, width, height);

      latest = await canvasToBlob(canvas, quality);
      if (latest.size <= TARGET_IMAGE_BYTES) {
        return toJpegFile(latest, file.name);
      }

      scale = Math.max(minimumScale, scale * 0.78);
      quality = Math.max(0.52, quality - 0.08);
    }

    if (!latest) throw new Error('Image optimization failed.');
    return toJpegFile(latest, file.name);
  } finally {
    bitmap.close();
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Image optimization failed.'));
      },
      'image/jpeg',
      quality,
    );
  });
}

function toJpegFile(blob: Blob, originalName: string): File {
  const baseName = originalName.replace(/\.[^.]+$/, '') || 'vivu-image';
  return new File([blob], `${baseName}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}
