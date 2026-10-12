/**
 * Utility untuk kompresi dan optimasi gambar sebelum di-upload ke Supabase Storage.
 * Mengurangi ukuran file dari kamera HP (3MB - 10MB) menjadi hanya ~70KB - 150KB tanpa kehilangan detail penting.
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82,
    mimeType = 'image/jpeg',
  } = options;

  // Jika bukan file gambar atau ukurannya sudah sangat kecil (< 80KB), tidak perlu kompres
  if (!file.type.startsWith('image/') || file.size < 80 * 1024) {
    return file;
  }

  // Jika SVG atau GIF animasi, jangan diubah via canvas
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Hitung aspek rasio agar dimensi tidak melebihi maxWidth/maxHeight
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            maxHeight && (height = Math.round((width * maxHeight) / width)); // fallback
            height = Math.round((img.height * width) / img.width);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // fallback ke file asli jika canvas gagal
          return;
        }

        // Gambar ke canvas dengan smoothing berkualitas tinggi
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // Jika hasil kompresi malah lebih besar (jarang), gunakan file asli
              resolve(file);
              return;
            }

            const targetName = file.name.replace(/\.[^/.]+$/, '.jpg');
            const compressedFile = new File([blob], targetName, {
              type: mimeType,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => {
        resolve(file); // fallback
      };

      if (typeof readerEvent.target?.result === 'string') {
        img.src = readerEvent.target.result;
      } else {
        resolve(file);
      }
    };

    reader.onerror = () => {
      resolve(file); // fallback
    };

    reader.readAsDataURL(file);
  });
}
