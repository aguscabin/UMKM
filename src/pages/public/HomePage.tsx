import React, { useMemo } from 'react';
import { Member, ForumEvent, Article, KELURAHAN_LIST } from '../../types';
import {
  Users,
  Store,
  MapPin,
  Tag,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Sparkles,
  Award,
  ChevronRight,
  Search,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Building2,
} from 'lucide-react';

interface HomePageProps {
  members: Member[];
  events: ForumEvent[];
  articles: Article[];
  setCurrentTab: (tab: string) => void;
  setSelectedEvent: (event: ForumEvent) => void;
  setSelectedArticle: (article: Article) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  members,
  events,
  articles,
  setCurrentTab,
  setSelectedEvent,
  setSelectedArticle,
}) => {
  // Compute live statistics from saved data without artificial mock fallbacks
  const publicMembers = useMemo(() => {
    return members.filter((m) => m.isPublicDirectory !== false && m.status !== 'nonaktif');
  }, [members]);

  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === 'aktif').length;
  const representedKelurahan = new Set(members.map((m) => m.kelurahan)).size;
  const categoriesCount = new Set(members.map((m) => m.category)).size;

  const upcomingEvents = events
    .filter((e) => e.status === 'terbit')
    .slice(0, 3);

  const latestArticles = articles
    .filter((a) => a.status === 'terbit')
    .slice(0, 3);

  // Dynamic showcase: shows active approved members in public directory
  const featuredMembers = useMemo(() => {
    if (publicMembers.length > 0) return publicMembers;
    const active = members.filter((m) => m.status !== 'nonaktif');
    return active.length > 0 ? active : members;
  }, [publicMembers, members]);

  return (
    <div className="space-y-24 pb-24">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-950 text-white pt-16 pb-28 lg:pt-24 lg:pb-36 border-b border-slate-800/80">
        {/* Subtle geometric & ambient lighting */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(13,148,136,0.18),rgba(255,255,255,0))]" />
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-teal-950/80 border border-teal-500/30 text-teal-300 text-xs font-semibold tracking-wider uppercase shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                <span>Portal Resmi UMKM Kecamatan Tangerang</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12]">
                Maju Bersama, Mandiri & Berdaya Saing{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-teal-200 to-amber-300">
                  KUAT
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
                Wadah resmi Forum UMKM Kecamatan Tangerang KUAT (<span className="text-slate-100 font-medium">Kreatif, Unggul, Aktif, Teladan</span>). Memfasilitasi penerbitan NIB & sertifikasi Halal, kurasi bazar, pelatihan wirausaha, serta promosi katalog produk unggulan di 8 kelurahan.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  onClick={() => {
                    setCurrentTab('direktori');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-2.5 bg-teal-600 hover:bg-teal-500 text-white px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base shadow-lg shadow-teal-950/40 hover:shadow-teal-600/30 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                >
                  <Store className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Jelajahi Direktori UMKM</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setCurrentTab('event');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white px-6 py-3.5 rounded-xl font-semibold text-sm sm:text-base border border-slate-700/80 hover:border-slate-600 hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                  <span>Agenda Kegiatan</span>
                </button>
              </div>

              {/* Trust markers */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>Fasilitasi OSS & Sertifikasi Halal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>8 Kelurahan Binaan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>Pendampingan Resmi Tanpa Calo</span>
                </div>
              </div>
            </div>

            {/* Right Card / Modern Civic Showcase */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                    <div>
                      <span className="text-[11px] uppercase font-bold text-teal-400 tracking-wider">
                        Ringkasan Wilayah Kerja
                      </span>
                      <h3 className="text-xl font-bold text-white mt-1">
                        Kecamatan Tangerang
                      </h3>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-sm tracking-wide">
                      KUAT
                    </div>
                  </div>

                  {/* 4 Key Stat Points */}
                  <div className="grid grid-cols-2 gap-3.5 my-6">
                    <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1.5">
                        <Users className="w-3.5 h-3.5 text-teal-400" />
                        <span>Total Anggota</span>
                      </div>
                      <div className="text-2xl font-black text-white">{totalMembers}</div>
                      <div className="text-[11px] text-teal-400 font-medium mt-1">
                        {activeMembers} Terverifikasi
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1.5">
                        <Building2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Kelurahan</span>
                      </div>
                      <div className="text-2xl font-black text-white">8/8</div>
                      <div className="text-[11px] text-amber-400 font-medium mt-1">
                        100% Wilayah Binaan
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1.5">
                        <Tag className="w-3.5 h-3.5 text-teal-400" />
                        <span>Kategori Usaha</span>
                      </div>
                      <div className="text-2xl font-black text-white">{categoriesCount}</div>
                      <div className="text-[11px] text-slate-400 mt-1">Kuliner, Kriya, Jasa</div>
                    </div>

                    <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>Legalitas</span>
                      </div>
                      <div className="text-2xl font-black text-white">NIB & Halal</div>
                      <div className="text-[11px] text-teal-400 mt-1">Proses Terfasilitasi</div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => {
                        setCurrentTab('profil');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white py-2.5 rounded-xl text-xs font-semibold border border-slate-700/60 transition-all cursor-pointer"
                    >
                      <span>Lihat Profil & Struktur Organisasi</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK STATS STRIP */}
      <section className="-mt-16 sm:-mt-20 relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/90 p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {totalMembers}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-500">Anggota Terdaftar</div>
          </div>
          <div className="space-y-1 border-l border-slate-200/80">
            <div className="text-3xl sm:text-4xl font-black text-teal-700 tracking-tight">
              {publicMembers.length}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-500">UMKM Katalog Publik</div>
          </div>
          <div className="space-y-1 border-l border-slate-200/80">
            <div className="text-3xl sm:text-4xl font-black text-amber-600 tracking-tight">
              8
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-500">Kelurahan Terwakili</div>
          </div>
          <div className="space-y-1 border-l border-slate-200/80">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {events.filter((e) => e.status === 'terbit').length}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-500">Program Berjalan</div>
          </div>
        </div>
      </section>

      {/* 8 KELURAHAN KECAMATAN TANGERANG */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-700">
            Sebaran Wilayah
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            8 Kelurahan di Kecamatan Tangerang
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Setiap kelurahan memiliki koordinator dan kelompok usaha binaan yang siap berkolaborasi menghadirkan produk berkualitas.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
          {KELURAHAN_LIST.map((kel) => {
            const count = members.filter((m) => m.kelurahan === kel).length;
            return (
              <div
                key={kel}
                onClick={() => {
                  setCurrentTab('direktori');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 hover:border-teal-500 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5 transition-all cursor-pointer text-center relative overflow-hidden"
              >
                <div className="h-11 w-11 mx-auto rounded-xl bg-teal-50 group-hover:bg-teal-600 flex items-center justify-center text-teal-700 group-hover:text-white transition-all mb-3.5">
                  <MapPin className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors text-sm sm:text-base">
                  Kel. {kel}
                </h4>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  <span className="font-bold text-teal-700">{count}</span> Pelaku Usaha
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FEATURED UMKM DIRECTORY PREVIEW */}
      <section id="sorotan-umkm" className="w-full bg-slate-100/60 py-16 md:py-20 border-y border-slate-200/80 block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
                Produk Unggulan Binaan
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1.5">
                Sorotan UMKM Binaan
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-1">
                Karya orisinal dan produk terverifikasi dari pelaku usaha binaan di 8 kelurahan Kecamatan Tangerang.
              </p>
            </div>
            <button
              onClick={() => {
                setCurrentTab('direktori');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-800 font-bold text-sm cursor-pointer self-start md:self-auto py-1 group"
            >
              <span>Lihat Semua Direktori UMKM</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Dynamic Grid: Empty State or Responsive Mobile/Desktop Cards */}
          {featuredMembers.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 sm:p-14 text-center border border-slate-200/90 shadow-sm space-y-5 max-w-2xl mx-auto">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-teal-50 border border-teal-200/70 flex items-center justify-center text-teal-700 shadow-2xs">
                <Store className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">
                  Data Sorotan UMKM Binaan Kosong
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                  Semua data sorotan UMKM binaan telah dikosongkan. Produk pelaku usaha yang didaftarkan dan diaktifkan tayang di etalase/direktori publik akan otomatis muncul di sini pada semua layar ponsel (HP) dan komputer.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setCurrentTab('daftar');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  <Store className="w-4 h-4" />
                  <span>Daftarkan Usaha Binaan</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentTab('direktori');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>Buka Direktori Lengkap</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              {featuredMembers.map((item) => {
                const waNumber = item.businessPhone ? item.businessPhone.replace(/\D/g, '').replace(/^0/, '62') : '';
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group flex flex-col justify-between h-full min-w-0"
                  >
                    <div className="flex-1 flex flex-col">
                      <div className="relative h-48 sm:h-52 w-full bg-slate-100 overflow-hidden flex-shrink-0">
                        <img
                          src={item.productPhoto || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80'}
                          alt={item.businessName}
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80';
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
                          {item.category}
                        </div>
                        <div className="absolute top-3 right-3 bg-teal-700/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-amber-300" />
                          <span>Terverifikasi</span>
                        </div>
                      </div>

                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="text-xs font-semibold text-teal-700 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-teal-600" />
                            <span>Kelurahan {item.kelurahan}</span>
                          </div>
                          <h3 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-teal-700 transition-colors" title={item.businessName}>
                            {item.businessName}
                          </h3>
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            <strong className="text-slate-800 font-semibold">Produk:</strong> {item.topProduct}
                          </p>
                        </div>

                        {item.legalities && (
                          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium truncate">
                            <span className="text-teal-700 font-semibold">Legalitas:</span> {item.legalities}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto bg-slate-50/50">
                      <span className="text-[11px] font-mono text-slate-400 truncate">
                        {item.memberNumber}
                      </span>
                      <a
                        href={waNumber ? `https://wa.me/${waNumber}?text=Halo%20${encodeURIComponent(item.businessName)},%20saya%20melihat%20produk%20Anda%20di%20Portal%20UMKM%20KUAT%20Kecamatan%20Tangerang` : '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
                      >
                        <span>Hubungi WA</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* UPCOMING EVENTS & ACTIVITIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-teal-700">
              Agenda & Kegiatan
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1.5">
              Kegiatan Mendatang Forum
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-1">
              Ikuti bazar promosi, pelatihan keterampilan, dan sosialisasi program pemerintah.
            </p>
          </div>
          <button
            onClick={() => {
              setCurrentTab('event');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-1.5 text-teal-700 hover:text-teal-800 font-bold text-sm cursor-pointer group"
          >
            <span>Semua Agenda</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {upcomingEvents.map((evt) => (
            <div
              key={evt.id}
              onClick={() => setSelectedEvent(evt)}
              className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={evt.posterUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80'}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-md shadow-xs">
                    {evt.date}
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <h3 className="font-bold text-slate-900 text-lg group-hover:text-teal-700 transition-colors line-clamp-2">
                    {evt.title}
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                    {evt.description}
                  </p>
                  <div className="pt-2 text-xs text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-700 flex-shrink-0" />
                    <span className="line-clamp-1">{evt.location}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <span className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 group-hover:bg-teal-700 text-slate-700 group-hover:text-white font-semibold text-xs transition-colors">
                  <span>Lihat Detail Agenda</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LATEST NEWS & ARTICLES */}
      <section className="bg-slate-100/60 py-18 md:py-24 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
                Publikasi & Edukasi
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1.5">
                Kabar Berita Terbaru
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-1">
                Informasi kebijakan, cerita sukses UMKM, dan panduan praktis wirausaha.
              </p>
            </div>
            <button
              onClick={() => {
                setCurrentTab('berita');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 text-teal-700 hover:text-teal-800 font-bold text-sm cursor-pointer group"
            >
              <span>Baca Semua Berita</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {latestArticles.map((art) => (
              <article
                key={art.id}
                onClick={() => setSelectedArticle(art)}
                className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={art.imageUrl || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-xs text-teal-300 text-xs font-semibold px-2.5 py-1 rounded-md">
                      {art.category}
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <span className="text-xs text-slate-400 font-medium">
                      {art.publishedDate} &bull; Oleh {art.author}
                    </span>
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-teal-700 transition-colors line-clamp-2">
                      {art.title}
                    </h3>
                    <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                      {art.excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0 flex items-center text-teal-700 font-semibold text-xs group-hover:translate-x-1 transition-transform">
                  <span>Baca Selengkapnya</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CALL TO ACTION / GABUNG FORUM */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-950 rounded-3xl p-8 sm:p-14 text-white relative overflow-hidden shadow-2xl border border-teal-800/40">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs uppercase px-3 py-1 rounded-md tracking-wider">
              Pendaftaran Anggota Terbuka
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-snug">
              Ingin Produk UMKM Anda Tampil dan Ikut Serta dalam Program Pembinaan?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Bergabunglah bersama ratusan pelaku usaha lainnya di Forum UMKM KUAT Kecamatan Tangerang. Dapatkan pendampingan sertifikasi Halal gratis, kemudahan NIB, dan akses bazar resmi.
            </p>
            <div className="pt-3 flex flex-wrap items-center gap-4">
              <button
                onClick={() => {
                  setCurrentTab('daftar');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <span>Daftar Online & Terbitkan KTA</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="https://wa.me/6281289234111?text=Halo%20Pengurus%20Forum%20UMKM%20KUAT%20Kecamatan%20Tangerang,%20saya%20ingin%20mendaftarkan%20usaha%20saya"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 px-5 py-3.5 rounded-xl font-semibold text-sm border border-slate-700/80 transition-colors"
              >
                <span>Konsultasi WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
