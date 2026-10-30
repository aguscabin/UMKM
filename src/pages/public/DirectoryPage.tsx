import React, { useState, useMemo } from 'react';
import { Member, KELURAHAN_LIST, BusinessCategory } from '../../types';
import {
  Search,
  Filter,
  MapPin,
  Tag,
  ShieldCheck,
  ExternalLink,
  Store,
  Phone,
  CheckCircle2,
  X,
  Building,
  Info,
} from 'lucide-react';

interface DirectoryPageProps {
  members: Member[];
}

export const DirectoryPage: React.FC<DirectoryPageProps> = ({ members }) => {
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Page Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider">
          <Store className="w-3.5 h-3.5 text-teal-600" />
          <span>Katalog Produk Unggulan</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Direktori UMKM Kecamatan Tangerang
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Temukan aneka kuliner lezat, kerajinan tangan, produk fashion, dan jasa unggulan binaan Forum UMKM KUAT yang tersebar di 8 kelurahan.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama usaha, produk unggulan, atau kata kunci..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm text-slate-700 font-medium transition-all"
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm text-slate-700 font-medium transition-all"
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
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            <span>Menampilkan</span>
            <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
              {filteredList.length}
            </span>
            <span>UMKM terverifikasi</span>
          </div>

          {(searchQuery || selectedKelurahan !== 'all' || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedKelurahan('all');
                setSelectedCategory('all');
              }}
              className="text-orange-600 hover:text-orange-700 font-semibold cursor-pointer underline flex items-center gap-1"
            >
              <span>Reset Filter</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Directory Grid */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Store className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Tidak Ada UMKM Ditemukan</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Coba ubah kata kunci pencarian atau reset filter kelurahan dan kategori usaha di atas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredList.map((member) => (
            <div
              key={member.id}
              onClick={() => setSelectedMember(member)}
              className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-xl hover:border-teal-300 transition-all duration-200 flex flex-col justify-between group cursor-pointer"
            >
              <div>
                {/* Photo & Category Badge */}
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={
                      member.productPhoto ||
                      'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80'
                    }
                    alt={member.businessName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
                    {member.category}
                  </div>
                  <div className="absolute top-3 right-3 bg-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Aktif</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-1 text-xs font-semibold text-teal-700">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Kelurahan {member.kelurahan}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base group-hover:text-teal-600 transition-colors line-clamp-1">
                    {member.businessName}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    <strong className="text-slate-800">Unggulan:</strong> {member.topProduct}
                  </p>

                  {/* Legalities tag */}
                  {member.legalities && (
                    <div className="pt-1 flex flex-wrap gap-1">
                      {member.legalities.split(',').map((leg, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium"
                        >
                          {leg.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Footer */}
              <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
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
                  className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Phone className="w-3 h-3" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="bg-teal-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                  {selectedMember.category}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {selectedMember.memberNumber}
                </span>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Product Photo */}
              <div className="relative h-64 w-full rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={
                    selectedMember.productPhoto ||
                    'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={selectedMember.businessName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {selectedMember.businessName}
                </h2>
                <div className="flex items-center gap-2 text-sm text-teal-700 font-medium mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>Kelurahan {selectedMember.kelurahan}, Kecamatan Tangerang</span>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-sm">
                <div>
                  <span className="text-xs text-slate-500 font-semibold uppercase">Produk Unggulan</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedMember.topProduct}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold uppercase">Nama Pemilik</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedMember.fullName}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold uppercase">Alamat Usaha</span>
                  <div className="text-slate-700 mt-0.5">{selectedMember.businessAddress}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold uppercase">Status Legalitas</span>
                  <div className="text-teal-700 font-semibold mt-0.5">
                    {selectedMember.legalities || 'Dalam Proses'}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
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
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
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
                className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Chat via WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
