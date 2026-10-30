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
    return members.filter((m) => m.isPublicDirectory && m.status !== 'nonaktif');
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

  // Dynamic showcase: only shows actual approved members set to public directory
  const featuredMembers = useMemo(() => {
    return publicMembers;
  }, [publicMembers]);

  return (
    <div className="space-y-20 pb-20">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white pt-16 pb-24 lg:pt-24 lg:pb-32">
        {/* Decorative background glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-semibold tracking-wide uppercase">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span>Gerakan Ekonomi Kerakyatan Kota Tangerang</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                Maju Bersama, Mandiri, dan{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-teal-200 to-orange-400">
                  KUAT
                </span>{' '}
                di Kecamatan Tangerang
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Portal resmi Forum UMKM Kecamatan Tangerang KUAT &ldquo;kreatif unggul aktif teladan&rdquo; Memfasilitasi legalitas usaha, peningkatan mutu produk unggulan, jaringan bazar, pelatihan digital, dan promosi direktori bagi pelaku UMKM di 8 kelurahan.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => {
                    setCurrentTab('direktori');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base shadow-lg shadow-teal-900/30 hover:shadow-teal-900/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Store className="w-5 h-5" />
                  <span>Jelajahi Direktori UMKM</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setCurrentTab('event');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white px-6 py-3.5 rounded-xl font-semibold text-sm sm:text-base border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
                >
                  <Calendar className="w-5 h-5 text-orange-400" />
                  <span>Lihat Agenda Kegiatan</span>
                </button>
              </div>

              {/* Trust badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>Fasilitasi NIB OSS & Halal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>8 Kelurahan Binaan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>Tanpa Biaya Calo</span>
                </div>
              </div>
            </div>

            {/* Right Card / Visual Showcase */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between pb-6 border-b border-slate-700">
                    <div>
                      <span className="text-xs uppercase font-bold text-teal-400 tracking-wider">
                        Ringkasan Komunitas
                      </span>
                      <h3 className="text-xl font-bold text-white mt-1">
                        Kecamatan Tangerang
                      </h3>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-black text-sm">
                      KUAT
                    </div>
                  </div>

                  {/* 4 Key Stat Points */}
                  <div className="grid grid-cols-2 gap-4 my-6">
                    <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <Users className="w-3.5 h-3.5 text-teal-400" />
                        <span>Total Anggota</span>
                      </div>
                      <div className="text-2xl font-black text-white">{totalMembers}</div>
                      <div className="text-[10px] text-teal-400 font-medium mt-0.5">
                        {activeMembers} Terverifikasi Aktif
                      </div>
                    </div>

                    <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <Building2 className="w-3.5 h-3.5 text-orange-400" />
                        <span>Kelurahan</span>
                      </div>
                      <div className="text-2xl font-black text-white">8/8</div>
                      <div className="text-[10px] text-orange-400 font-medium mt-0.5">
                        100% Wilayah Terjangkau
                      </div>
                    </div>

                    <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <Tag className="w-3.5 h-3.5 text-teal-400" />
                        <span>Kategori Usaha</span>
                      </div>
                      <div className="text-2xl font-black text-white">{categoriesCount}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Kuliner, Kriya, Jasa, dll</div>
                    </div>

                    <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <Award className="w-3.5 h-3.5 text-orange-400" />
                        <span>Legalitas</span>
                      </div>
                      <div className="text-2xl font-black text-white">NIB & Halal</div>
                      <div className="text-[10px] text-teal-400 mt-0.5">Pendampingan Resmi</div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setCurrentTab('profil');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-slate-700/60 hover:bg-slate-700 text-white py-2.5 rounded-lg text-xs font-semibold transition-colors"
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
      <section className="-mt-12 relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {totalMembers}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-500">Anggota Terdaftar</div>
          </div>
          <div className="space-y-1 border-l border-slate-200">
            <div className="text-3xl sm:text-4xl font-extrabold text-teal-600 tracking-tight">
              {publicMembers.length}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-500">UMKM Katalog Publik</div>
          </div>
          <div className="space-y-1 border-l border-slate-200">
            <div className="text-3xl sm:text-4xl font-extrabold text-orange-600 tracking-tight">
              8
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-500">Kelurahan Terwakili</div>
          </div>
          <div className="space-y-1 border-l border-slate-200">
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {events.filter((e) => e.status === 'terbit').length}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-500">Program Berjalan</div>
          </div>
        </div>
      </section>

      {/* 8 KELURAHAN KECAMATAN TANGERANG */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
            Sebaran Wilayah
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            8 Kelurahan di Kecamatan Tangerang
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Setiap kelurahan memiliki koordinator dan kelompok usaha binaan yang siap berkolaborasi menghadirkan produk berkualitas.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {KELURAHAN_LIST.map((kel) => {
            const count = members.filter((m) => m.kelurahan === kel).length;
            return (
              <div
                key={kel}
                onClick={() => {
                  setCurrentTab('direktori');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group bg-white p-5 rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all cursor-pointer text-center relative overflow-hidden"
              >
                <div className="h-10 w-10 mx-auto rounded-full bg-teal-50 group-hover:bg-teal-500 flex items-center justify-center text-teal-600 group-hover:text-white transition-colors mb-3">
                  <MapPin className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors text-sm sm:text-base">
                  Kel. {kel}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  <span className="font-semibold text-teal-600">{count}</span> Pelaku Usaha
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FEATURED UMKM DIRECTORY PREVIEW */}
      <section id="sorotan-umkm" className="w-full bg-slate-100/70 py-12 md:py-16 border-y border-slate-200 block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200 inline-block">
                Produk Unggulan Binaan
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
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
              className="inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-800 font-bold text-sm cursor-pointer self-start md:self-auto py-1"
            >
              <span>Lihat Semua Direktori UMKM</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Dynamic Grid: Empty State or Responsive Mobile/Desktop Cards */}
          {featuredMembers.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200/90 shadow-2xs space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                <Store className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-lg mx-auto">
                <h3 className="text-xl font-bold text-slate-800">
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
                  className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 w-full">
              {featuredMembers.map((item) => {
                const waNumber = item.businessPhone ? item.businessPhone.replace(/\D/g, '').replace(/^0/, '62') : '';
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-lg transition-all duration-200 group flex flex-col justify-between h-full min-w-0"
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
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
                          {item.category}
                        </div>
                        <div className="absolute top-3 right-3 bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Binaan Terverifikasi</span>
                        </div>
                      </div>

                      <div className="p-4 sm:p-5 space-y-2.5 flex-1 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="text-xs font-semibold text-teal-700 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-teal-600" />
                            <span>Kelurahan {item.kelurahan}</span>
                          </div>
                          <h3 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-teal-600 transition-colors" title={item.businessName}>
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

                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto bg-slate-50/50">
                      <span className="text-[11px] font-mono text-slate-400 truncate">
                        {item.memberNumber}
                      </span>
                      <a
                        href={waNumber ? `https://wa.me/${waNumber}?text=Halo%20${encodeURIComponent(item.businessName)},%20saya%20melihat%20produk%20Anda%20di%20Portal%20UMKM%20KUAT%20Kecamatan%20Tangerang` : '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
              Agenda & Kegiatan
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
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
            className="flex items-center gap-1.5 text-teal-700 hover:text-teal-800 font-bold text-sm cursor-pointer"
          >
            <span>Semua Agenda</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {upcomingEvents.map((evt) => (
            <div
              key={evt.id}
              onClick={() => setSelectedEvent(evt)}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={evt.posterUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80'}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-md shadow-xs">
                    {evt.date}
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <h3 className="font-bold text-slate-900 text-lg group-hover:text-teal-600 transition-colors line-clamp-2">
                    {evt.title}
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                    {evt.description}
                  </p>
                  <div className="pt-2 space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                      <span className="line-clamp-1">{evt.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <span className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-teal-50 group-hover:bg-teal-600 text-teal-700 group-hover:text-white font-semibold text-xs transition-colors">
                  <span>Lihat Detail Agenda</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LATEST NEWS & ARTICLES */}
      <section className="bg-slate-50 py-16 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                Publikasi & Edukasi
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
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
              className="flex items-center gap-1.5 text-teal-700 hover:text-teal-800 font-bold text-sm cursor-pointer"
            >
              <span>Baca Semua Berita</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestArticles.map((art) => (
              <article
                key={art.id}
                onClick={() => setSelectedArticle(art)}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={art.imageUrl || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-teal-300 text-xs font-semibold px-2.5 py-1 rounded-md">
                      {art.category}
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <span className="text-xs text-slate-400 font-medium">
                      {art.publishedDate} &bull; Oleh {art.author}
                    </span>
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-teal-600 transition-colors line-clamp-2">
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
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl border border-teal-800/40">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="bg-orange-500 text-white font-bold text-xs uppercase px-3 py-1 rounded-full">
              Pendaftaran Anggota Terbuka
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
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
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base shadow-lg transition-transform hover:scale-105 cursor-pointer"
              >
                <span>Daftar Online & Terbitkan KTA</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="https://wa.me/6281289234111?text=Halo%20Pengurus%20Forum%20UMKM%20KUAT%20Kecamatan%20Tangerang,%20saya%20ingin%20mendaftarkan%20usaha%20saya"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-3.5 rounded-xl font-semibold text-sm transition-colors"
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
