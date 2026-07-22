/**
 * Compress an image file using the Canvas API.
 * Returns a new File (or Blob) that is significantly smaller.
 *
 * @param file   - The original image File
 * @param opts   - Compression options
 * @returns      - A compressed Blob wrapped in a Promise
 */
export interface CompressOptions {
  /** Maximum width in pixels (default 1024) */
  maxWidth?: number;
  /** Maximum height in pixels (default 1024) */
  maxHeight?: number;
  /** JPEG / WebP quality 0‥1 (default 0.8) */
  quality?: number;
  /** Output mime type (default 'image/webp', fallback 'image/jpeg') */
  mimeType?: string;
}

export async function compressImage(
  file: File,
  opts: CompressOptions = {},
): Promise<Blob> {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.8,
    mimeType = 'image/webp',
  } = opts;

  // If the file is already tiny (< 200 KB), skip compression
  if (file.size < 200 * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down only if the image exceeds the max dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Gagal membuat canvas'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Try the preferred mimeType first; fall back to jpeg if unsupported
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            // Fallback to jpeg
            canvas.toBlob(
              (fallback) => {
                if (fallback) resolve(fallback);
                else reject(new Error('Gagal mengkompresi gambar'));
              },
              'image/jpeg',
              quality,
            );
          }
        },
        mimeType,
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gagal memuat gambar'));
    };

    img.src = url;
  });
}

/**
 * Compress an image and return a new File object (with a name).
 */
export async function compressImageToFile(
  file: File,
  opts?: CompressOptions,
): Promise<File> {
  const blob = await compressImage(file, opts);
  // Preserve original extension where possible, otherwise .webp
  const ext = (opts?.mimeType?.includes('jpeg') || opts?.mimeType?.includes('jpg'))
    ? '.jpg'
    : '.webp';
  const name = file.name.replace(/\.[^.]+$/, '') + '_compressed' + ext;
  return new File([blob], name, { type: blob.type });
}