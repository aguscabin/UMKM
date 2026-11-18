import React, { useState, useRef, useEffect } from 'react';
import { Member } from '../../types';
import { getMemberProductPhotos } from '../../utils/image';
import { DEFAULT_PRODUCT_PHOTO_PLACEHOLDER } from '../../utils/excelImport';
import { ShimmerImage } from './Skeleton';
import { MapPin, Phone, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductCatalogCardProps {
  member: Member;
  onSelect: (member: Member) => void;
}

export const ProductCatalogCard: React.FC<ProductCatalogCardProps> = ({
  member,
  onSelect,
}) => {
  const photos = getMemberProductPhotos(member);
  const slides = photos.length > 0 ? photos : [DEFAULT_PRODUCT_PHOTO_PLACEHOLDER];
  const hasMultiplePhotos = slides.length > 1;
  const viewCount = Math.max(0, Number(member.viewCount ?? 0));

  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const didSwipeRef = useRef(false);

  useEffect(() => {
    if (activeIndex >= slides.length) {
      setActiveIndex(0);
    }
  }, [slides.length, activeIndex]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!hasMultiplePhotos || e.touches.length !== 1) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    didSwipeRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!hasMultiplePhotos || !touchStartRef.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    const dy = e.touches[0].clientY - touchStartRef.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      // Mencegah swipe horizontal pada mini-karousel foto menarik karousel utama secara bersamaan
      e.stopPropagation();
      didSwipeRef.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!hasMultiplePhotos || !touchStartRef.current) return;
    const touch = e.changedTouches[0];
    if (!touch) {
      touchStartRef.current = null;
      return;
    }
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 32) {
      e.stopPropagation();
      if (dx < 0 && activeIndex < slides.length - 1) {
        setActiveIndex((prev) => prev + 1);
      } else if (dx > 0 && activeIndex > 0) {
        setActiveIndex((prev) => prev - 1);
      }
    }
    touchStartRef.current = null;
  };

  const handleCardClick = () => {
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }
    onSelect(member);
  };

  const waDigits = (member.businessPhone || member.phone || '').replace(/\D/g, '').replace(/^0/, '62');

  return (
    <article
      onClick={handleCardClick}
      className="card-hover-interactive bg-white rounded-xl border border-stone-200 overflow-hidden flex flex-col justify-between h-full group cursor-pointer min-w-0 select-none"
    >
      {/* Top Section: Square Photo Area + Core Info */}
      <div className="flex-1 flex flex-col">
        {/* Square 1:1 Photo Area / Internal Mini-Carousel */}
        <div
          className="relative aspect-square w-full bg-stone-100 overflow-hidden flex-shrink-0"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex w-full h-full transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {slides.map((src, idx) => (
              <div key={`${member.id}-slide-${idx}`} className="w-full h-full flex-shrink-0">
                <ShimmerImage
                  src={src}
                  fallbackSrc={DEFAULT_PRODUCT_PHOTO_PLACEHOLDER}
                  alt={`${member.businessName} - ${member.topProduct} (${idx + 1})`}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                />
              </div>
            ))}
          </div>

          {/* Left & Right Mini-Carousel Slide Buttons when > 1 photo */}
          {hasMultiplePhotos && (
            <>
              <button
                type="button"
                aria-label="Foto produk sebelumnya"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
                }}
                className="btn-micro absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-stone-800 border border-stone-200/80 shadow-sm flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Foto produk berikutnya"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((prev) => (prev + 1) % slides.length);
                }}
                className="btn-micro absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-stone-800 border border-stone-200/80 shadow-sm flex items-center justify-center cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Pagination Dots when > 1 photo */}
          {hasMultiplePhotos && (
            <div
              className="absolute inset-x-0 bottom-0 pt-6 pb-2 flex items-center justify-center gap-1 bg-gradient-to-t from-black/45 via-black/15 to-transparent"
              onClick={(e) => e.stopPropagation()}
            >
              {slides.map((_, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Lihat foto produk ${idx + 1} dari ${slides.length}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIndex(idx);
                    }}
                    className="p-1 flex items-center justify-center cursor-pointer focus:outline-hidden"
                  >
                    <span
                      className={`block h-1.5 rounded-full transition-all duration-200 ${
                        isActive
                          ? 'w-4 bg-white shadow-xs'
                          : 'w-1.5 bg-white/60 hover:bg-white/90'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Core Product / Business Info (Clean, Uniform Line Budget) */}
        <div className="p-3.5 sm:p-4 flex-1 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-700 min-w-0">
            <span className="truncate">{member.category}</span>
            <span className="text-stone-300 flex-shrink-0">&bull;</span>
            <span className="inline-flex items-center gap-0.5 truncate text-stone-500 font-medium">
              <MapPin className="w-3 h-3 flex-shrink-0 text-teal-700" />
              <span className="truncate">{member.kelurahan}</span>
            </span>
          </div>

          <h3
            className="font-bold text-sm sm:text-base text-stone-900 group-hover:text-teal-700 transition-colors duration-200 line-clamp-1 leading-snug"
            title={member.businessName}
          >
            {member.businessName}
          </h3>

          <p
            className="text-xs text-stone-600 line-clamp-2 min-h-[2.25rem] leading-relaxed"
            title={member.topProduct}
          >
            {member.topProduct}
          </p>
        </div>
      </div>

      {/* Footer: View Count directly above WhatsApp & Detail Action */}
      <div className="px-3.5 pb-3.5 pt-2.5 sm:px-4 sm:pb-4 border-t border-stone-100 bg-stone-50/70 space-y-2.5">
        {/* Keterangan Produk Dilihat di atas tombol WhatsApp */}
        <div className="flex items-center justify-between text-xs tabular-nums">
          <span className="inline-flex items-center gap-1.5 text-stone-500 font-medium">
            <Eye className="w-3.5 h-3.5 text-teal-700 flex-shrink-0" />
            <span>Dilihat</span>
          </span>
          <span className="font-bold text-stone-900">
            {viewCount.toLocaleString('id-ID')} kali
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!waDigits) return;
              window.open(
                `https://wa.me/${waDigits}?text=Halo%20${encodeURIComponent(
                  member.businessName
                )},%20saya%20tertarik%20dengan%20produk%20Anda%20di%20Katalog%20Produk%20UMKM%20KUAT%20Kecamatan%20Tangerang`,
                '_blank'
              );
            }}
            className="group/btn btn-micro flex-1 inline-flex items-center justify-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-3 py-2 rounded-lg min-h-[38px] cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5 group-hover/btn:-rotate-12 transition-transform duration-150" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(member);
            }}
            aria-label={`Lihat detail ${member.businessName}`}
            className="btn-micro inline-flex items-center justify-center gap-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-xs font-semibold px-2.5 py-2 rounded-lg min-h-[38px] cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-teal-700" />
            <span>Detail</span>
          </button>
        </div>
      </div>
    </article>
  );
};
