import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Member } from '../../types';
import { ProductCatalogCard } from './ProductCatalogCard';

interface ProductCatalogCarouselProps {
  members: Member[];
  onSelectMember: (member: Member) => void;
}

export const ProductCatalogCarousel: React.FC<ProductCatalogCarouselProps> = ({
  members,
  onSelectMember,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(maxScroll - el.scrollLeft > 8);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: 0 });
    updateScrollButtons();

    const handleResize = () => updateScrollButtons();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [members, updateScrollButtons]);

  const scrollByStep = (direction: 'prev' | 'next') => {
    const el = trackRef.current;
    if (!el) return;
    const step = Math.max(260, Math.round(el.clientWidth * 0.78));
    el.scrollBy({
      left: direction === 'next' ? step : -step,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative group/carousel">
      {/* Left Navigation Arrow Button */}
      <button
        type="button"
        onClick={() => scrollByStep('prev')}
        disabled={!canScrollLeft}
        aria-label="Produk sebelumnya"
        className={`hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-white/95 border border-stone-200 text-stone-800 shadow-md hover:bg-teal-700 hover:text-white hover:border-teal-700 transition-all duration-150 absolute -left-3 lg:-left-5 top-1/2 -translate-y-1/2 z-20 cursor-pointer ${
          canScrollLeft
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Right Navigation Arrow Button */}
      <button
        type="button"
        onClick={() => scrollByStep('next')}
        disabled={!canScrollRight}
        aria-label="Produk berikutnya"
        className={`hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-white/95 border border-stone-200 text-stone-800 shadow-md hover:bg-teal-700 hover:text-white hover:border-teal-700 transition-all duration-150 absolute -right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-20 cursor-pointer ${
          canScrollRight
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Horizontal Touch-Swipe & Scroll-Snap Track */}
      {/* Mobile: 74% (1 full card + ~24% peek of next), Small: 44% (2 cards + peek), Medium: 3 cards, Large+: 4 cards */}
      <div
        ref={trackRef}
        onScroll={updateScrollButtons}
        className="flex items-stretch gap-3.5 sm:gap-4 lg:gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar pb-2 px-0.5"
      >
        {members.map((member) => (
          <div
            key={member.id}
            className="flex-none snap-start w-[74%] sm:w-[44%] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3.75rem)/4)] flex"
          >
            <div className="w-full h-full">
              <ProductCatalogCard member={member} onSelect={onSelectMember} />
            </div>
          </div>
        ))}
      </div>

      {/* Compact Mobile & Quick Navigation Footer Bar */}
      {members.length > 1 && (
        <div className="flex sm:hidden items-center justify-between pt-2 text-[11px] text-stone-500">
          <span>Geser ke samping untuk lihat produk lainnya</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollByStep('prev')}
              disabled={!canScrollLeft}
              aria-label="Geser kiri"
              className="w-8 h-8 rounded-lg border border-stone-200 bg-white flex items-center justify-center text-stone-700 disabled:opacity-35 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollByStep('next')}
              disabled={!canScrollRight}
              aria-label="Geser kanan"
              className="w-8 h-8 rounded-lg border border-stone-200 bg-white flex items-center justify-center text-stone-700 disabled:opacity-35 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
