/**
 * Utility to compress images using HTML5 Canvas before uploading or storing in Firestore/LocalStorage.
 * Reduces 3-10MB digital camera/phone photos to ~25-45KB lightweight JPEG Data URLs.
 * Ensures data stays far below Firestore's 1MB document limit and LocalStorage's 5MB limit.
 */
export const compressImage = (
  file: File,
  maxWidth = 500,
  maxHeight = 500,
  quality = 0.82
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File yang dipilih bukan berkas gambar.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gagal memuat gambar untuk dikompresi.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Fill white background for transparent PNG/GIF to prevent black artifacts in JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to lightweight JPEG dataURL (typically 20KB - 40KB)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Kompresi khusus unggahan multi-foto produk (hingga 5 foto per UMKM).
 * Menjaga ukuran tiap foto tetap ringan (~40KB - 95KB) agar gabungan 5 foto + pas foto
 * tetap jauh di bawah batas 1MB dokumen Firestore dan cepat dimuat.
 */
export const compressProductImage = async (file: File): Promise<string> => {
  const maxChars = 130_000; // ~95 KB base64
  const attempts: Array<{ size: number; quality: number }> = [
    { size: 540, quality: 0.78 },
    { size: 480, quality: 0.68 },
    { size: 420, quality: 0.56 },
  ];

  let result = '';
  for (const attempt of attempts) {
    result = await compressImage(file, attempt.size, attempt.size, attempt.quality);
    if (result.length <= maxChars) {
      return result;
    }
  }
  return result;
};

/**
 * Mengambil daftar foto produk anggota secara kompatibel dengan data lama (single productPhoto)
 * maupun data baru (array productPhotos maksimal 5 foto).
 */
export const getMemberProductPhotos = (member: {
  productPhotos?: string[];
  productPhoto?: string;
}): string[] => {
  const list: string[] = [];
  if (Array.isArray(member.productPhotos)) {
    for (const item of member.productPhotos) {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (trimmed && !list.includes(trimmed)) {
          list.push(trimmed);
        }
      }
      if (list.length >= 5) break;
    }
  }
  if (list.length === 0 && typeof member.productPhoto === 'string' && member.productPhoto.trim()) {
    list.push(member.productPhoto.trim());
  }
  return list.slice(0, 5);
};

