import React, { useRef, useState } from 'react';
import { Upload, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { compressProductImage } from '../../utils/image';
import { validateUploadedFile } from '../../utils/validation';
import { InlineShimmer } from './Skeleton';

interface MultiProductPhotoUploaderProps {
  photos: string[];
  onChange: (nextPhotos: string[]) => void;
  maxPhotos?: number;
  onError?: (message: string) => void;
  label?: string;
}

export const MultiProductPhotoUploader: React.FC<MultiProductPhotoUploaderProps> = ({
  photos,
  onChange,
  maxPhotos = 5,
  onError,
  label = 'Foto Produk Unggulan',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const reportError = (msg: string) => {
    setLocalError(msg);
    onError?.(msg);
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setLocalError(null);
    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots <= 0) {
      reportError(`Maksimal ${maxPhotos} foto produk per usaha sudah tercapai.`);
      e.target.value = '';
      return;
    }

    const selectedFiles = Array.from(fileList);
    if (selectedFiles.length > remainingSlots) {
      reportError(
        `Hanya ${remainingSlots} foto tambahan yang diproses (maksimal ${maxPhotos} foto per usaha).`
      );
    }

    const filesToProcess = selectedFiles.slice(0, remainingSlots);
    setIsCompressing(true);

    try {
      const nextAdded: string[] = [];
      for (const file of filesToProcess) {
        const check = validateUploadedFile(file, 'image');
        if (!check.valid) {
          reportError(check.error || `File "${file.name}" tidak valid.`);
          continue;
        }
        const compressed = await compressProductImage(file);
        if (compressed && !photos.includes(compressed) && !nextAdded.includes(compressed)) {
          nextAdded.push(compressed);
        }
      }

      if (nextAdded.length > 0) {
        onChange([...photos, ...nextAdded].slice(0, maxPhotos));
      }
    } catch (err: any) {
      reportError('Gagal memproses foto produk: ' + (err?.message || 'Format gambar tidak didukung.'));
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setLocalError(null);
    const next = photos.filter((_, idx) => idx !== indexToRemove);
    onChange(next);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-xs font-bold text-stone-700">
          {label}{' '}
          <span className="font-semibold text-stone-500">
            (Maks. {maxPhotos} foto, kompresi otomatis)
          </span>
        </label>
        <span className="text-[11px] font-bold text-teal-700 tabular-nums">
          {photos.length}/{maxPhotos} Foto
        </span>
      </div>

      {/* Upload & Add More Action */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          disabled={isCompressing || photos.length >= maxPhotos}
          onClick={() => inputRef.current?.click()}
          className="px-4 py-2.5 min-h-[42px] bg-stone-100 hover:bg-stone-200 disabled:opacity-55 disabled:cursor-not-allowed text-stone-800 border border-stone-300 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
        >
          {isCompressing ? (
            <InlineShimmer variant="light" label="Mengompres foto" widthClass="w-28" />
          ) : photos.length === 0 ? (
            <>
              <Upload className="w-4 h-4 text-teal-700" />
              <span>Pilih / Upload Foto Produk (Bisa Lebih dari 1)</span>
            </>
          ) : photos.length < maxPhotos ? (
            <>
              <Plus className="w-4 h-4 text-teal-700" />
              <span>Tambah Foto Lagi ({photos.length}/{maxPhotos})</span>
            </>
          ) : (
            <>
              <ImageIcon className="w-4 h-4 text-teal-700" />
              <span>Batas Maksimal {maxPhotos} Foto Tercapai</span>
            </>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesSelected}
          className="hidden"
        />
      </div>

      {localError && (
        <p className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
          {localError}
        </p>
      )}

      {/* Thumbnail Previews Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 pt-1">
          {photos.map((photoSrc, idx) => (
            <div
              key={`${idx}-${photoSrc.slice(0, 32)}`}
              className="relative aspect-square rounded-xl overflow-hidden border border-stone-200 bg-stone-100 group"
            >
              <img
                src={photoSrc}
                alt={`Preview Produk ${idx + 1}`}
                className="w-full h-full object-cover block"
              />
              {idx === 0 && (
                <span className="absolute bottom-1.5 left-1.5 bg-[#121918]/85 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  Utama
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemovePhoto(idx)}
                title={`Hapus foto ${idx + 1}`}
                aria-label={`Hapus foto produk ${idx + 1}`}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600/90 hover:bg-red-700 text-white flex items-center justify-center shadow-sm cursor-pointer transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
