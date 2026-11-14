import React, { useState, useMemo } from 'react';
import { Member, KELURAHAN_LIST } from '../../types';
import { DEFAULT_PRODUCT_PHOTO_PLACEHOLDER } from '../../utils/excelImport';
import {
  Search,
  MapPin,
  ShieldCheck,
  ExternalLink,
  Store,
  Phone,
  X,
  ArrowUpRight,
} from 'lucide-react';
import {
  CatalogCardSkeleton,
  InlineShimmer,
  ShimmerImage,
} from '../../components/common/Skeleton';

interface DirectoryPageProps {
  members: Member[];
  isLoading?: boolean;
}

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

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    publicMembers.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return Array.from(set).sort();
  }, [publicMembers]);

  // Filtered result
  const filteredList = useMemo(() => {
    return publicMembers.filter((m) => {
      const matchSearch =
        searchQuery === '' ||
        m.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.topProduct.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category.toLowerCase().includes(searchQuery.toLowerCase());

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
          Direktori UMKM Kecamatan Tangerang
        </h1>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
          Temukan aneka kuliner lezat, kerajinan tangan, produk fashion, dan jasa unggulan binaan Forum UMKM KUAT yang tersebar di 8 kelurahan.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama usaha, produk unggulan, atau kata kunci..."
              className="w-full pl-11 pr-9 py-2.5 min-h-[44px] rounded-xl border border-stone-200 bg-stone-50 hover:border-stone-300 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 text-sm text-stone-900 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="btn-micro absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/70 rounded-md p-1 cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Kelurahan Filter */}
          <div className="md:col-span-3">
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

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-stone-200 bg-stone-50 hover:border-stone-300 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 text-sm text-stone-800 font-medium transition-colors cursor-pointer"
            >
              <option value="all">Semua Kategori Usaha</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filter Tags / Results Count */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stone-100 text-xs text-stone-500">
          <div className="flex items-center gap-1.5 font-medium">
            <span>Menampilkan</span>
            {showSkeleton ? (
              <InlineShimmer variant="light" label="Memuat jumlah UMKM" widthClass="w-8" />
            ) : (
              <span className="font-bold text-teal-800 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-md tabular-nums">
                {filteredList.length}
              </span>
            )}
            <span>UMKM terverifikasi aktif</span>
          </div>

          {(searchQuery || selectedKelurahan !== 'all' || selectedCategory !== 'all') && (
            <button
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

      {/* Directory Grid */}
      {showSkeleton ? (
        <CatalogCardSkeleton count={8} />
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 sm:p-16 text-center border border-stone-200 space-y-4 max-w-lg mx-auto">
          <div className="h-14 w-14 mx-auto rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400">
            <Store className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-stone-900 text-lg">Tidak Ada UMKM Ditemukan</h3>
          <p className="text-stone-500 text-xs sm:text-sm leading-relaxed">
            Coba ubah kata kunci pencarian atau reset filter kelurahan dan kategori usaha di atas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-6 w-full">
          {filteredList.map((member) => (
            <div
              key={member.id}
              onClick={() => setSelectedMember(member)}
              className="card-hover-interactive bg-white rounded-xl border border-stone-200 overflow-hidden flex flex-col justify-between h-full group cursor-pointer min-w-0"
            >
              <div className="flex-1 flex flex-col">
                {/* Photo & Category Badge */}
                <div className="relative aspect-square w-full bg-stone-100 overflow-hidden flex-shrink-0">
                  <ShimmerImage
                    src={member.productPhoto || DEFAULT_PRODUCT_PHOTO_PLACEHOLDER}
                    fallbackSrc={DEFAULT_PRODUCT_PHOTO_PLACEHOLDER}
                    alt={member.businessName}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  />
                  <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 max-w-[68%] truncate bg-[#121918]/90 text-white text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-md border border-stone-700/60">
                    {member.category}
                  </div>
                  <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 bg-teal-700 text-white text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-300 flex-shrink-0" />
                    <span className="hidden sm:inline">Terverifikasi</span>
                  </div>
                  {/* Hover quick-view indicator */}
                  <div className="pointer-events-none hidden sm:flex items-center justify-between px-2.5 py-1.5 absolute inset-x-2 bottom-2 rounded-lg bg-[#121918]/90 text-white text-[11px] font-semibold border border-stone-700/70 opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]">
                    <span>Lihat Detail Usaha</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-teal-400" />
                  </div>
                </div>

                {/* Content (Preserving Exact 4 Lines) */}
                <div className="p-2.5 sm:p-3 lg:p-4 flex-1 flex flex-col justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-teal-700 min-w-0">
                      <MapPin className="w-3 h-3 flex-shrink-0 text-teal-700" />
                      <span className="truncate">Kelurahan {member.kelurahan}</span>
                    </div>

                    <h3
                      className="font-bold text-sm sm:text-base text-stone-900 group-hover:text-teal-700 transition-colors duration-200 line-clamp-1 leading-snug"
                      title={member.businessName}
                    >
                      {member.businessName}
                    </h3>

                    <p className="text-xs text-stone-600 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                      <strong className="text-stone-800 font-semibold">Produk:</strong> {member.topProduct}
                    </p>
                  </div>

                  {/* Legalities row aligned at bottom of info block */}
                  {member.legalities && (
                    <div className="pt-1.5 mt-auto border-t border-stone-100">
                      <span
                        className="inline-block max-w-full truncate text-[10px] sm:text-[11px] bg-stone-100 text-stone-800 border border-stone-200 px-2 py-0.5 rounded-md font-medium"
                        title={`Legalitas: ${member.legalities}`}
                      >
                        <strong className="font-semibold text-teal-700">Legalitas:</strong> {member.legalities}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Footer */}
              <div className="px-2.5 pb-2.5 pt-2 sm:px-3 sm:pb-3 lg:px-4 lg:pb-4 border-t border-stone-100 flex items-center justify-between gap-2 bg-stone-50/70">
                <span className="hidden sm:inline text-[10px] lg:text-[11px] text-stone-400 font-mono truncate tabular-nums">
                  {member.memberNumber}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const waNum = member.businessPhone.replace(/^0/, '62').replace(/\D/g, '');
                    window.open(
                      `https://wa.me/${waNum}?text=Halo%20${encodeURIComponent(
                        member.businessName
                      )},%20saya%20tertarik%20dengan%20produk%20Anda%20di%20Portal%20UMKM%20KUAT%20Kecamatan%20Tangerang`,
                      '_blank'
                    );
                  }}
                  className="group/btn btn-micro w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0 cursor-pointer"
                >
                  <Phone className="w-3 h-3 group-hover/btn:-rotate-12 transition-transform duration-150" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/65 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <span className="bg-teal-700 text-white text-xs font-bold px-2.5 py-0.5 rounded-md">
                  {selectedMember.category}
                </span>
                <span className="text-xs text-stone-500 font-mono tabular-nums">
                  {selectedMember.memberNumber}
                </span>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="btn-micro text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200 cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Product Photo */}
              <div className="relative h-64 w-full rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                <ShimmerImage
                  src={selectedMember.productPhoto || DEFAULT_PRODUCT_PHOTO_PLACEHOLDER}
                  fallbackSrc={DEFAULT_PRODUCT_PHOTO_PLACEHOLDER}
                  alt={selectedMember.businessName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h2 className="text-2xl font-black text-stone-900">
                  {selectedMember.businessName}
                </h2>
                <div className="flex items-center gap-2 text-sm text-teal-700 font-medium mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>Kelurahan {selectedMember.kelurahan}, Kecamatan Tangerang</span>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200 text-sm">
                <div>
                  <span className="text-xs text-stone-500 font-semibold uppercase">Produk Unggulan</span>
                  <div className="font-bold text-stone-900 mt-0.5">{selectedMember.topProduct}</div>
                </div>
                <div>
                  <span className="text-xs text-stone-500 font-semibold uppercase">Nama Pemilik</span>
                  <div className="font-bold text-stone-900 mt-0.5">{selectedMember.fullName}</div>
                </div>
                <div>
                  <span className="text-xs text-stone-500 font-semibold uppercase">Alamat Usaha</span>
                  <div className="text-stone-700 mt-0.5">{selectedMember.businessAddress}</div>
                </div>
                <div>
                  <span className="text-xs text-stone-500 font-semibold uppercase">Status Legalitas</span>
                  <div className="text-teal-700 font-semibold mt-0.5">
                    {selectedMember.legalities || 'Dalam Proses'}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Jaminan Produk Binaan Resmi</span>
                </div>
                <p>
                  Usaha ini telah terdaftar dan dibina langsung oleh Forum UMKM KUAT Kecamatan Tangerang. Mendukung gerakan belanja produk lokal.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-stone-200 bg-stone-50 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-stone-500">
                Kontak langsung pemilik usaha melalui WhatsApp
              </span>
              <button
                onClick={() => {
                  const waNum = selectedMember.businessPhone.replace(/^0/, '62').replace(/\D/g, '');
                  window.open(
                    `https://wa.me/${waNum}?text=Halo%20${encodeURIComponent(
                      selectedMember.businessName
                    )},%20saya%20melihat%20katalog%20produk%20Anda%20di%20Portal%20UMKM%20KUAT%20Kecamatan%20Tangerang`,
                    '_blank'
                  );
                }}
                className="group/btn btn-micro inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer min-h-[42px]"
              >
                <Phone className="w-4 h-4 group-hover/btn:-rotate-12 transition-transform duration-150" />
                <span>Chat via WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform duration-150" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
