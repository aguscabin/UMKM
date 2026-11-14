import React, { useMemo } from 'react';
import { Member, ForumEvent, Article, KELURAHAN_LIST } from '../../types';
import { DEFAULT_PRODUCT_PHOTO_PLACEHOLDER } from '../../utils/excelImport';
import {
  Users,
  Store,
  MapPin,
  Tag,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Award,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import {
  CatalogCardSkeleton,
  EventNewsCardSkeleton,
  ShimmerImage,
} from '../../components/common/Skeleton';

interface HomePageProps {
  members: Member[];
  events: ForumEvent[];
  articles: Article[];
  isLoading?: boolean;
  setCurrentTab: (tab: string) => void;
  setSelectedEvent: (event: ForumEvent) => void;
  setSelectedArticle: (article: Article) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  members,
  events,
  articles,
  isLoading = false,
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
    return members.filter((m) => m.status !== 'nonaktif' && m.isPublicDirectory !== false);
  }, [members]);

  return (
    <div className="space-y-20 sm:space-y-24 pb-24">
      {/* HERO SECTION */}
      <section className="bg-[#121918] text-stone-100 pt-14 pb-24 lg:pt-20 lg:pb-32 border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-stone-900 border border-stone-700 text-teal-300 text-xs font-semibold tracking-wider uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Portal Resmi UMKM Kecamatan Tangerang</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-black tracking-tight leading-[1.08] text-white">
                Maju Bersama, Mandiri &amp; Berdaya Saing{' '}
                <span className="text-amber-400">KUAT</span>
              </h1>

              <p className="text-base sm:text-lg text-stone-300 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
                Wadah resmi Forum UMKM Kecamatan Tangerang KUAT (<span className="text-white font-medium">Kreatif, Unggul, Aktif, Teladan</span>). Memfasilitasi penerbitan NIB &amp; sertifikasi Halal, kurasi bazar, pelatihan wirausaha, serta promosi katalog produk unggulan di 8 kelurahan.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  onClick={() => {
                    setCurrentTab('direktori');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group btn-micro inline-flex items-center justify-center gap-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base cursor-pointer min-h-[48px]"
                >
                  <Store className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Jelajahi Direktori UMKM</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                </button>

                <button
                  onClick={() => {
                    setCurrentTab('event');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group btn-micro inline-flex items-center justify-center gap-2.5 bg-stone-900 hover:bg-stone-800 text-stone-200 hover:text-white px-6 py-3.5 rounded-xl font-semibold text-sm sm:text-base border border-stone-700 hover:border-stone-600 cursor-pointer min-h-[48px]"
                >
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400 group-hover:scale-110 transition-transform duration-200" />
                  <span>Agenda Kegiatan</span>
                </button>
              </div>

              {/* Trust markers */}
              <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-stone-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Fasilitasi OSS &amp; Sertifikasi Halal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>8 Kelurahan Binaan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Pendampingan Resmi Tanpa Calo</span>
                </div>
              </div>
            </div>

            {/* Right Card / Civic Summary */}
            <div className="lg:col-span-5">
              <div className="mx-auto max-w-md lg:max-w-none">
                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-8">
                  <div className="flex items-center justify-between pb-5 border-b border-stone-800">
                    <div>
                      <span className="text-[11px] uppercase font-bold text-teal-400 tracking-wider">
                        Ringkasan Wilayah Kerja
                      </span>
                      <h3 className="text-xl font-bold text-white mt-1">
                        Kecamatan Tangerang
                      </h3>
                    </div>
                    <div className="h-10 px-3 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center text-amber-400 font-black text-xs tracking-widest">
                      KUAT
                    </div>
                  </div>

                  {/* 4 Key Stat Points */}
                  <div className="grid grid-cols-2 gap-3.5 my-6">
                    <div className="bg-[#121918] p-4 rounded-xl border border-stone-800">
                      <div className="flex items-center gap-1.5 text-stone-400 text-xs mb-1.5">
                        <Users className="w-3.5 h-3.5 text-teal-400" />
                        <span>Total Anggota</span>
                      </div>
                      <div className="text-2xl font-black text-white tabular-nums">{totalMembers}</div>
                      <div className="text-[11px] text-teal-400 font-medium mt-1 tabular-nums">
                        {activeMembers} Terverifikasi
                      </div>
                    </div>

                    <div className="bg-[#121918] p-4 rounded-xl border border-stone-800">
                      <div className="flex items-center gap-1.5 text-stone-400 text-xs mb-1.5">
                        <Building2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Kelurahan</span>
                      </div>
                      <div className="text-2xl font-black text-white tabular-nums">8/8</div>
                      <div className="text-[11px] text-amber-400 font-medium mt-1">
                        100% Wilayah Binaan
                      </div>
                    </div>

                    <div className="bg-[#121918] p-4 rounded-xl border border-stone-800">
                      <div className="flex items-center gap-1.5 text-stone-400 text-xs mb-1.5">
                        <Tag className="w-3.5 h-3.5 text-teal-400" />
                        <span>Kategori Usaha</span>
                      </div>
                      <div className="text-2xl font-black text-white tabular-nums">{categoriesCount}</div>
                      <div className="text-[11px] text-stone-400 mt-1">Kuliner, Kriya, Jasa</div>
                    </div>

                    <div className="bg-[#121918] p-4 rounded-xl border border-stone-800">
                      <div className="flex items-center gap-1.5 text-stone-400 text-xs mb-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>Legalitas</span>
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-white">NIB &amp; Halal</div>
                      <div className="text-[11px] text-teal-400 mt-1">Proses Terfasilitasi</div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => {
                        setCurrentTab('profil');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="group btn-micro w-full flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-100 py-3 rounded-xl text-xs font-semibold border border-stone-700 cursor-pointer min-h-[42px]"
                    >
                      <span>Lihat Profil &amp; Struktur Organisasi</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK STATS STRIP */}
      <section className="-mt-12 sm:-mt-16 relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:divide-x md:divide-stone-200">
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight tabular-nums">
              {totalMembers}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-stone-500">Anggota Terdaftar</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-teal-700 tracking-tight tabular-nums">
              {publicMembers.length}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-stone-500">UMKM Katalog Publik</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-amber-600 tracking-tight tabular-nums">
              {representedKelurahan || 8}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-stone-500">Kelurahan Terwakili</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight tabular-nums">
              {events.filter((e) => e.status === 'terbit').length}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-stone-500">Program Berjalan</div>
          </div>
        </div>
      </section>

      {/* 8 KELURAHAN KECAMATAN TANGERANG */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10 sm:mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-700">
            Sebaran Wilayah
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
            8 Kelurahan di Kecamatan Tangerang
          </h2>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            Setiap kelurahan memiliki koordinator dan kelompok usaha binaan yang siap berkolaborasi menghadirkan produk berkualitas.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-5">
          {KELURAHAN_LIST.map((kel) => {
            const count = members.filter((m) => m.kelurahan === kel).length;
            return (
              <div
                key={kel}
                onClick={() => {
                  setCurrentTab('direktori');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group card-hover-interactive bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 cursor-pointer text-center"
              >
                <div className="h-11 w-11 mx-auto rounded-xl bg-stone-100 border border-stone-200 group-hover:bg-teal-700 group-hover:border-teal-700 group-hover:scale-105 flex items-center justify-center text-teal-700 group-hover:text-white transition-all duration-200 mb-3.5">
                  <MapPin className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-stone-900 group-hover:text-teal-700 transition-colors text-sm sm:text-base">
                  Kel. {kel}
                </h4>
                <p className="text-xs text-stone-500 mt-1 font-medium tabular-nums">
                  <span className="font-bold text-teal-700">{count}</span> Pelaku Usaha
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FEATURED UMKM DIRECTORY PREVIEW */}
      <section id="sorotan-umkm" className="w-full bg-stone-100/80 py-14 sm:py-16 md:py-20 border-y border-stone-200 block">
        <div className="max-w-3xl mx-auto px-3 lg:max-w-7xl lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
                Produk Unggulan Binaan
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight mt-1.5">
                Sorotan UMKM Binaan
              </h2>
              <p className="text-stone-600 text-sm sm:text-base mt-1">
                Karya orisinal dan produk terverifikasi dari pelaku usaha binaan di 8 kelurahan Kecamatan Tangerang.
              </p>
            </div>
            <button
              onClick={() => {
                setCurrentTab('direktori');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="btn-micro inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-800 font-bold text-sm cursor-pointer self-start md:self-auto px-3 py-1.5 rounded-lg hover:bg-white/80 group"
            >
              <span>Lihat Semua Direktori UMKM</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>

          {/* Dynamic Grid: Skeleton Shimmer, Empty State, or Mobile/Tablet E-Commerce Grid */}
          {isLoading && members.length === 0 ? (
            <CatalogCardSkeleton count={4} />
          ) : featuredMembers.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 sm:p-14 text-center border border-stone-200 space-y-5 max-w-2xl mx-auto">
              <div className="h-14 w-14 mx-auto rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-teal-700">
                <Store className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-stone-900">
                  Data Sorotan UMKM Binaan Kosong
                </h3>
                <p className="text-stone-500 text-xs sm:text-sm leading-relaxed">
                  Semua data sorotan UMKM binaan telah dikosongkan. Produk pelaku usaha yang didaftarkan dan diaktifkan tayang di etalase/direktori publik akan otomatis muncul di sini pada semua layar ponsel (HP) dan komputer.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setCurrentTab('daftar');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="btn-micro inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer min-h-[42px]"
                >
                  <Store className="w-4 h-4" />
                  <span>Daftarkan Usaha Binaan</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentTab('direktori');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group btn-micro inline-flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-700 px-5 py-2.5 rounded-xl text-xs font-bold border border-stone-200 cursor-pointer min-h-[42px]"
                >
                  <span>Buka Direktori Lengkap</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-6 w-full">
              {featuredMembers.map((item) => {
                const waNumber = item.businessPhone ? item.businessPhone.replace(/\D/g, '').replace(/^0/, '62') : '';
                return (
                  <div
                    key={item.id}
                    className="card-hover-interactive bg-white rounded-xl overflow-hidden border border-stone-200 group flex flex-col justify-between h-full min-w-0"
                  >
                    <div className="flex-1 flex flex-col">
                      <div className="relative aspect-square w-full bg-stone-100 overflow-hidden flex-shrink-0">
                        <ShimmerImage
                          src={item.productPhoto || DEFAULT_PRODUCT_PHOTO_PLACEHOLDER}
                          fallbackSrc={DEFAULT_PRODUCT_PHOTO_PLACEHOLDER}
                          alt={item.businessName}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        />
                        <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 max-w-[68%] truncate bg-[#121918]/90 text-white text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-md border border-stone-700/60">
                          {item.category}
                        </div>
                        <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 bg-teal-700 text-white text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-amber-300 flex-shrink-0" />
                          <span className="hidden sm:inline">Terverifikasi</span>
                        </div>
                      </div>

                      <div className="p-2.5 sm:p-3 lg:p-4 flex-1 flex flex-col justify-between gap-2">
                        <div className="space-y-1">
                          <div className="text-[11px] font-medium text-teal-700 flex items-center gap-1 min-w-0">
                            <MapPin className="w-3 h-3 flex-shrink-0 text-teal-700" />
                            <span className="truncate">Kelurahan {item.kelurahan}</span>
                          </div>
                          <h3
                            className="font-bold text-sm sm:text-base text-stone-900 line-clamp-1 group-hover:text-teal-700 transition-colors duration-200 leading-snug"
                            title={item.businessName}
                          >
                            {item.businessName}
                          </h3>
                          <p className="text-xs text-stone-600 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                            <strong className="text-stone-800 font-semibold">Produk:</strong> {item.topProduct}
                          </p>
                        </div>

                        {item.legalities && (
                          <div className="pt-1.5 mt-auto border-t border-stone-100">
                            <span
                              className="inline-block max-w-full truncate text-[10px] sm:text-[11px] bg-stone-100 text-stone-800 border border-stone-200 px-2 py-0.5 rounded-md font-medium"
                              title={`Legalitas: ${item.legalities}`}
                            >
                              <strong className="font-semibold text-teal-700">Legalitas:</strong> {item.legalities}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-2.5 pb-2.5 pt-2 sm:px-3 sm:pb-3 lg:px-4 lg:pb-4 border-t border-stone-100 flex items-center justify-between gap-2 bg-stone-50/70">
                      <span className="hidden sm:inline text-[10px] lg:text-[11px] font-mono text-stone-400 truncate tabular-nums">
                        {item.memberNumber}
                      </span>
                      <a
                        href={waNumber ? `https://wa.me/${waNumber}?text=Halo%20${encodeURIComponent(item.businessName)},%20saya%20melihat%20produk%20Anda%20di%20Portal%20UMKM%20KUAT%20Kecamatan%20Tangerang` : '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="group/btn btn-micro w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-[11px] sm:text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 cursor-pointer"
                      >
                        <span>Hubungi WA</span>
                        <ExternalLink className="w-3 h-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform duration-150" />
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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-teal-700">
              Agenda &amp; Kegiatan
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight mt-1.5">
              Kegiatan Mendatang Forum
            </h2>
            <p className="text-stone-600 text-sm sm:text-base mt-1">
              Ikuti bazar promosi, pelatihan keterampilan, dan sosialisasi program pemerintah.
            </p>
          </div>
          <button
            onClick={() => {
              setCurrentTab('event');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="btn-micro flex items-center gap-1.5 text-teal-700 hover:text-teal-800 font-bold text-sm cursor-pointer group self-start md:self-auto px-3 py-1.5 rounded-lg hover:bg-stone-100"
          >
            <span>Semua Agenda</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </div>

        {isLoading && events.length === 0 ? (
          <EventNewsCardSkeleton count={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {upcomingEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => setSelectedEvent(evt)}
                className="card-hover-interactive bg-white rounded-2xl border border-stone-200 overflow-hidden cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-[16/10] w-full bg-stone-100 overflow-hidden border-b border-stone-100">
                    <ShimmerImage
                      src={evt.posterUrl || DEFAULT_PRODUCT_PHOTO_PLACEHOLDER}
                      fallbackSrc={DEFAULT_PRODUCT_PHOTO_PLACEHOLDER}
                      alt={evt.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    />
                    <div className="absolute top-3 left-3 bg-[#121918]/90 text-white text-xs font-bold px-3 py-1 rounded-md border border-stone-700/60 tabular-nums">
                      {evt.date}
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <h3 className="font-bold text-stone-900 text-lg group-hover:text-teal-700 transition-colors duration-200 line-clamp-2">
                      {evt.title}
                    </h3>
                    <p className="text-stone-600 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                      {evt.description}
                    </p>
                    <div className="pt-2 text-xs text-stone-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-teal-700 flex-shrink-0" />
                      <span className="line-clamp-1">{evt.location}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <span className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-stone-100 border border-stone-200 group-hover:bg-teal-700 group-hover:border-teal-700 text-stone-800 group-hover:text-white font-semibold text-xs transition-colors duration-200">
                    <span>Lihat Detail Agenda</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* LATEST NEWS & ARTICLES */}
      <section className="bg-stone-100/80 py-16 md:py-20 border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
                Publikasi &amp; Edukasi
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight mt-1.5">
                Kabar Berita Terbaru
              </h2>
              <p className="text-stone-600 text-sm sm:text-base mt-1">
                Informasi kebijakan, cerita sukses UMKM, dan panduan praktis wirausaha.
              </p>
            </div>
            <button
              onClick={() => {
                setCurrentTab('berita');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="btn-micro flex items-center gap-1.5 text-teal-700 hover:text-teal-800 font-bold text-sm cursor-pointer group self-start md:self-auto px-3 py-1.5 rounded-lg hover:bg-white/80"
            >
              <span>Baca Semua Berita</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>

          {isLoading && articles.length === 0 ? (
            <EventNewsCardSkeleton count={3} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {latestArticles.map((art) => (
                <article
                  key={art.id}
                  onClick={() => setSelectedArticle(art)}
                  className="card-hover-interactive bg-white rounded-2xl border border-stone-200 overflow-hidden cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-[16/10] w-full bg-stone-100 overflow-hidden border-b border-stone-100">
                      <ShimmerImage
                        src={art.imageUrl || DEFAULT_PRODUCT_PHOTO_PLACEHOLDER}
                        fallbackSrc={DEFAULT_PRODUCT_PHOTO_PLACEHOLDER}
                        alt={art.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      />
                      <div className="absolute top-3 left-3 bg-[#121918]/90 text-teal-300 text-xs font-semibold px-2.5 py-1 rounded-md border border-stone-700/60">
                        {art.category}
                      </div>
                    </div>

                    <div className="p-6 space-y-3">
                      <span className="text-xs text-stone-400 font-medium tabular-nums">
                        {art.publishedDate} &bull; Oleh {art.author}
                      </span>
                      <h3 className="font-bold text-stone-900 text-lg group-hover:text-teal-700 transition-colors duration-200 line-clamp-2">
                        {art.title}
                      </h3>
                      <p className="text-stone-600 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                        {art.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 flex items-center text-teal-700 font-semibold text-xs">
                    <span>Baca Selengkapnya</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CALL TO ACTION / GABUNG FORUM */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#121918] rounded-2xl p-8 sm:p-14 text-white border border-stone-800">
          <div className="max-w-2xl space-y-4">
            <span className="inline-block bg-stone-900 text-amber-400 border border-stone-700 font-bold text-xs uppercase px-3 py-1 rounded-md tracking-wider">
              Pendaftaran Anggota Terbuka
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-snug text-white">
              Ingin Produk UMKM Anda Tampil dan Ikut Serta dalam Program Pembinaan?
            </h2>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
              Bergabunglah bersama ratusan pelaku usaha lainnya di Forum UMKM KUAT Kecamatan Tangerang. Dapatkan pendampingan sertifikasi Halal gratis, kemudahan NIB, dan akses bazar resmi.
            </p>
            <div className="pt-3 flex flex-wrap items-center gap-3.5">
              <button
                onClick={() => {
                  setCurrentTab('daftar');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group btn-micro inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base cursor-pointer min-h-[48px]"
              >
                <span>Daftar Online &amp; Terbitkan KTA</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
              </button>
              <a
                href="https://wa.me/6282258570582?text=Halo%20Pengurus%20Forum%20UMKM%20KUAT%20Kecamatan%20Tangerang,%20saya%20ingin%20mendaftarkan%20usaha%20saya"
                target="_blank"
                rel="noreferrer"
                className="btn-micro inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-stone-200 px-5 py-3.5 rounded-xl font-semibold text-sm border border-stone-700 min-h-[48px]"
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
