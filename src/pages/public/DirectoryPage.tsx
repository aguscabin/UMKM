import React, { useState, useMemo } from 'react';
import { Member, KELURAHAN_LIST } from '../../types';
import {
  Search,
  Store,
  X,
} from 'lucide-react';
import {
  CatalogCardSkeleton,
  InlineShimmer,
} from '../../components/common/Skeleton';
import { ProductCatalogCarousel } from '../../components/common/ProductCatalogCarousel';
import { ProductDetailModal } from '../../components/common/ProductDetailModal';

interface DirectoryPageProps {
  members: Member[];
  isLoading?: boolean;
}

const CORE_CATEGORIES = [
  'Kuliner',
  'Kriya & Kerajinan',
  'Fashion & Tekstil',
  'Jasa & Konsultasi',
] as const;

export const DirectoryPage: React.FC<DirectoryPageProps> = ({
  members,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelurahan, setSelectedKelurahan] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // STRICT COMPLIANCE: Only show members with isPublicDirectory === true
  const publicMembers = useMemo(() => {
    return members.filter((m) => Boolean(m.isPublicDirectory) && m.status !== 'nonaktif');
  }, [members]);

  // Gabungkan kategori inti + kategori unik lain dari database agar filter kategori selalu lengkap
  const categories = useMemo(() => {
    const ordered: string[] = [...CORE_CATEGORIES];
    publicMembers.forEach((m) => {
      if (m.category && !ordered.includes(m.category)) {
        ordered.push(m.category);
      }
    });
    return ordered;
  }, [publicMembers]);

  // Filtered result
  const filteredList = useMemo(() => {
    return publicMembers.filter((m) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        q === '' ||
        m.businessName.toLowerCase().includes(q) ||
        m.topProduct.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.kelurahan.toLowerCase().includes(q);

      const matchKelurahan =
        selectedKelurahan === 'all' || m.kelurahan === selectedKelurahan;

      const matchCategory =
        selectedCategory === 'all' || m.category === selectedCategory;

      return matchSearch && matchKelurahan && matchCategory;
    });
  }, [publicMembers, searchQuery, selectedKelurahan, selectedCategory]);

  const showSkeleton = isLoading && members.length === 0;

  return (
    <div className="max-w-3xl mx-auto px-3 lg:max-w-7xl lg:px-8 py-12 sm:py-16 space-y-8 sm:space-y-10">
      {/* Page Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-teal-700">
          Katalog Produk Unggulan
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight">
          Katalog Produk UMKM Kecamatan Tangerang
        </h1>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
          Temukan aneka kuliner lezat, kerajinan tangan, produk fashion, dan jasa unggulan binaan Forum UMKM KUAT yang tersebar di 8 kelurahan.
        </p>
      </div>

      {/* Search & Kelurahan Filter Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Search Input */}
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama produk, nama usaha, atau kata kunci..."
              className="w-full pl-11 pr-9 py-2.5 min-h-[44px] rounded-xl border border-stone-200 bg-stone-50 hover:border-stone-300 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 text-sm text-stone-900 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="btn-micro absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/70 rounded-md p-1 cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Kelurahan Filter */}
          <div className="md:col-span-4">
            <select
              value={selectedKelurahan}
              onChange={(e) => setSelectedKelurahan(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-stone-200 bg-stone-50 hover:border-stone-300 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 text-sm text-stone-800 font-medium transition-colors cursor-pointer"
            >
              <option value="all">Semua Kelurahan (8 Wilayah)</option>
              {KELURAHAN_LIST.map((kel) => (
                <option key={kel} value={kel}>
                  Kelurahan {kel}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stone-100 text-xs text-stone-500">
          <div className="flex items-center gap-1.5 font-medium">
            <span>Menampilkan</span>
            {showSkeleton ? (
              <InlineShimmer variant="light" label="Memuat jumlah produk" widthClass="w-8" />
            ) : (
              <span className="font-bold text-teal-800 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-md tabular-nums">
                {filteredList.length}
              </span>
            )}
            <span>produk UMKM binaan aktif</span>
          </div>

          {(searchQuery || selectedKelurahan !== 'all' || selectedCategory !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedKelurahan('all');
                setSelectedCategory('all');
              }}
              className="btn-micro text-amber-700 hover:text-amber-800 font-semibold cursor-pointer underline flex items-center gap-1 px-2 py-1 rounded-md hover:bg-amber-50"
            >
              <span>Reset Filter</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Category Filter Buttons Above Carousel */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`btn-micro flex-shrink-0 px-4 py-2 min-h-[40px] rounded-xl text-xs sm:text-sm border cursor-pointer transition-colors ${
              selectedCategory === 'all'
                ? 'bg-teal-700 text-white border-teal-700 font-bold'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100 font-medium'
            }`}
          >
            Semua
          </button>

          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`btn-micro flex-shrink-0 px-4 py-2 min-h-[40px] rounded-xl text-xs sm:text-sm border cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-teal-700 text-white border-teal-700 font-bold'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100 font-medium'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Responsive Horizontal Product Catalog Carousel */}
        {showSkeleton ? (
          <CatalogCardSkeleton count={4} />
        ) : filteredList.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 sm:p-16 text-center border border-stone-200 space-y-4 max-w-lg mx-auto">
            <div className="h-14 w-14 mx-auto rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400">
              <Store className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-stone-900 text-lg">Tidak Ada Produk Ditemukan</h3>
            <p className="text-stone-500 text-xs sm:text-sm leading-relaxed">
              Coba ubah kata kunci pencarian atau pilih kategori usaha lainnya di atas.
            </p>
          </div>
        ) : (
          <ProductCatalogCarousel
            members={filteredList}
            onSelectMember={setSelectedMember}
          />
        )}
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  );
};
