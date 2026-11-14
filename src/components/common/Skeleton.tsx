import React, { useState, useEffect, useRef } from 'react';

interface SkeletonBoxProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  className = '',
  variant = 'light',
}) => (
  <div
    aria-hidden="true"
    className={`${
      variant === 'dark' ? 'skeleton-shimmer-dark' : 'skeleton-shimmer'
    } ${className}`}
  />
);

interface InlineShimmerProps {
  variant?: 'light' | 'dark';
  label?: string;
  widthClass?: string;
}

export const InlineShimmer: React.FC<InlineShimmerProps> = ({
  variant = 'dark',
  label = 'Memuat',
  widthClass = 'w-24',
}) => (
  <span
    className="inline-flex items-center gap-1.5"
    role="status"
    aria-label={label}
  >
    <span
      aria-hidden="true"
      className={`inline-block h-2.5 ${widthClass} rounded-full ${
        variant === 'dark' ? 'skeleton-shimmer-dark' : 'skeleton-shimmer'
      }`}
    />
    <span className="sr-only">{label}</span>
  </span>
);

interface ShimmerImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc: string;
  containerClassName?: string;
}

export const ShimmerImage: React.FC<ShimmerImageProps> = ({
  src,
  fallbackSrc,
  alt,
  className = '',
  containerClassName = '',
  onError,
  onLoad,
  ...rest
}) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    } else {
      setLoaded(false);
    }
  }, [src]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${containerClassName}`}>
      {!loaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 skeleton-shimmer z-0"
        />
      )}
      <img
        ref={imgRef}
        src={src || fallbackSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          const el = e.currentTarget;
          if (el.src !== fallbackSrc) {
            el.src = fallbackSrc;
          }
          setLoaded(true);
          onError?.(e);
        }}
        className={`${className} transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...rest}
      />
    </div>
  );
};

interface CatalogCardSkeletonProps {
  count?: number;
}

export const CatalogCardSkeleton: React.FC<CatalogCardSkeletonProps> = ({
  count = 8,
}) => (
  <div
    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-6 w-full"
    aria-busy="true"
    aria-label="Memuat katalog UMKM"
  >
    {Array.from({ length: count }).map((_, idx) => (
      <div
        key={idx}
        className="bg-white rounded-xl border border-stone-200 overflow-hidden flex flex-col justify-between h-full min-w-0"
      >
        <div className="flex-1 flex flex-col">
          {/* Square image skeleton */}
          <SkeletonBox className="aspect-square w-full" />

          {/* Exact 4-row card content proportions */}
          <div className="p-2.5 sm:p-3 lg:p-4 flex-1 flex flex-col justify-between gap-2">
            <div className="space-y-2">
              {/* Row 1: Kelurahan */}
              <SkeletonBox className="h-3 w-2/3 rounded" />
              {/* Row 2: Nama Usaha */}
              <SkeletonBox className="h-4 w-5/6 rounded" />
              {/* Row 3: Produk */}
              <div className="space-y-1.5 pt-0.5">
                <SkeletonBox className="h-3 w-full rounded" />
                <SkeletonBox className="h-3 w-3/4 rounded" />
              </div>
            </div>

            {/* Row 4: Legalitas */}
            <div className="pt-1.5 mt-auto border-t border-stone-100">
              <SkeletonBox className="h-5 w-1/2 rounded-md" />
            </div>
          </div>
        </div>

        {/* Footer action */}
        <div className="px-2.5 pb-2.5 pt-2 sm:px-3 sm:pb-3 lg:px-4 lg:pb-4 border-t border-stone-100 flex items-center justify-between gap-2 bg-stone-50/70">
          <SkeletonBox className="hidden sm:block h-3 w-20 rounded" />
          <SkeletonBox className="h-7 w-full sm:w-24 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

interface EventNewsCardSkeletonProps {
  count?: number;
}

export const EventNewsCardSkeleton: React.FC<EventNewsCardSkeletonProps> = ({
  count = 3,
}) => (
  <div
    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    aria-busy="true"
    aria-label="Memuat daftar konten"
  >
    {Array.from({ length: count }).map((_, idx) => (
      <div
        key={idx}
        className="bg-white rounded-2xl border border-stone-200 overflow-hidden flex flex-col justify-between"
      >
        <div>
          <SkeletonBox className="aspect-[16/10] w-full" />
          <div className="p-6 space-y-3">
            <SkeletonBox className="h-3 w-1/2 rounded" />
            <SkeletonBox className="h-5 w-11/12 rounded" />
            <div className="space-y-1.5">
              <SkeletonBox className="h-3.5 w-full rounded" />
              <SkeletonBox className="h-3.5 w-4/5 rounded" />
            </div>
          </div>
        </div>
        <div className="p-6 pt-0">
          <SkeletonBox className="h-9 w-full rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);

interface ProfileStructureSkeletonProps {
  count?: number;
}

export const ProfileStructureSkeleton: React.FC<ProfileStructureSkeletonProps> = ({
  count = 3,
}) => (
  <div
    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    aria-busy="true"
    aria-label="Memuat struktur organisasi"
  >
    {Array.from({ length: count }).map((_, idx) => (
      <div
        key={idx}
        className="bg-white rounded-2xl border border-stone-200 p-7 flex flex-col items-center space-y-4"
      >
        <SkeletonBox className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl" />
        <SkeletonBox className="h-5 w-40 rounded" />
        <SkeletonBox className="h-3.5 w-28 rounded" />
      </div>
    ))}
  </div>
);

export const AdminGuardSkeleton: React.FC = () => (
  <div
    className="min-h-screen bg-[#121918] flex items-center justify-center p-4"
    aria-busy="true"
    aria-label="Memverifikasi sesi admin"
  >
    <div className="bg-white rounded-2xl p-8 max-w-md w-full space-y-6 border border-stone-200">
      <SkeletonBox className="h-14 w-14 rounded-xl mx-auto" />
      <div className="space-y-2.5 flex flex-col items-center">
        <SkeletonBox className="h-6 w-48 rounded" />
        <SkeletonBox className="h-3.5 w-full rounded" />
        <SkeletonBox className="h-3.5 w-4/5 rounded" />
      </div>
      <div className="space-y-2.5 pt-2">
        <SkeletonBox className="h-11 w-full rounded-xl" />
        <SkeletonBox className="h-8 w-40 rounded-lg mx-auto" />
      </div>
    </div>
  </div>
);
