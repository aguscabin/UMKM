import React, { useState } from 'react';
import { ForumEvent } from '../../types';
import { DEFAULT_PRODUCT_PHOTO_PLACEHOLDER } from '../../utils/excelImport';
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  ExternalLink,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  EventNewsCardSkeleton,
  ShimmerImage,
} from '../../components/common/Skeleton';

interface EventsPageProps {
  events: ForumEvent[];
  isLoading?: boolean;
  selectedEvent: ForumEvent | null;
  setSelectedEvent: (event: ForumEvent | null) => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({
  events,
  isLoading = false,
  selectedEvent,
  setSelectedEvent,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'terbit' | 'selesai'>('all');

  // Filter only published or completed events for public
  const publicEvents = events.filter((e) => e.status === 'terbit' || e.status === 'selesai');

  const filteredEvents = publicEvents.filter((e) => {
    const matchSearch =
      search === '' ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filter === 'all' || e.status === filter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 space-y-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
          Agenda &amp; Pelatihan
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight">
          Event &amp; Kegiatan Forum UMKM KUAT
        </h1>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
          Ikuti berbagai agenda bazar tahunan, workshop legalitas NIB &amp; Halal, pelatihan pemasaran digital, dan temu bisnis di Kecamatan Tangerang.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kegiatan atau lokasi..."
            className="w-full pl-10 pr-4 py-2.5 min-h-[42px] rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-900 focus:bg-white focus:outline-hidden focus:border-teal-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`btn-micro px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-bold cursor-pointer tabular-nums ${
              filter === 'all'
                ? 'bg-teal-700 text-white'
                : 'bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200'
            }`}
          >
            Semua ({publicEvents.length})
          </button>
          <button
            onClick={() => setFilter('terbit')}
            className={`btn-micro px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-bold cursor-pointer ${
              filter === 'terbit'
                ? 'bg-teal-700 text-white'
                : 'bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200'
            }`}
          >
            Mendatang
          </button>
          <button
            onClick={() => setFilter('selesai')}
            className={`btn-micro px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-bold cursor-pointer ${
              filter === 'selesai'
                ? 'bg-teal-700 text-white'
                : 'bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200'
            }`}
          >
            Telah Selesai
          </button>
        </div>
      </div>

      {/* Events Grid */}
      {isLoading && events.length === 0 ? (
        <EventNewsCardSkeleton count={6} />
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 space-y-3">
          <Calendar className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-bold text-stone-900 text-lg">Tidak Ada Kegiatan Ditemukan</h3>
          <p className="text-stone-500 text-sm">Silakan ubah kata kunci atau filter status kegiatan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              onClick={() => setSelectedEvent(evt)}
              className="card-hover-interactive bg-white rounded-2xl border border-stone-200 overflow-hidden group flex flex-col justify-between cursor-pointer"
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
                  {evt.status === 'selesai' && (
                    <div className="absolute top-3 right-3 bg-stone-900/90 text-stone-200 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-stone-700">
                      Selesai
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-3">
                  <h3 className="font-bold text-stone-900 text-lg group-hover:text-teal-700 transition-colors duration-200 line-clamp-2">
                    {evt.title}
                  </h3>
                  <p className="text-stone-600 text-sm line-clamp-2 leading-relaxed">
                    {evt.description}
                  </p>
                  <div className="pt-2 space-y-1.5 text-xs text-stone-500">
                    <div className="flex items-center gap-2 tabular-nums">
                      <Clock className="w-3.5 h-3.5 text-teal-700 flex-shrink-0" />
                      <span>{evt.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-teal-700 flex-shrink-0" />
                      <span className="line-clamp-1">{evt.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <span className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-stone-100 border border-stone-200 group-hover:bg-teal-700 group-hover:border-teal-700 text-stone-800 group-hover:text-white font-semibold text-xs transition-colors duration-200">
                  <span>Lihat Selengkapnya</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EVENT DETAIL MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/65 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <span className="text-xs font-bold text-amber-800 uppercase bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-md">
                Agenda Forum UMKM KUAT
              </span>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200 cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="relative h-64 w-full rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                <img
                  src={selectedEvent.posterUrl || DEFAULT_PRODUCT_PHOTO_PLACEHOLDER}
                  alt={selectedEvent.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_PHOTO_PLACEHOLDER;
                  }}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h2 className="text-2xl font-black text-stone-900">{selectedEvent.title}</h2>
                <div className="flex flex-wrap gap-4 text-xs text-stone-600 mt-3 pt-3 border-t border-stone-100">
                  <div className="flex items-center gap-1.5 font-semibold text-teal-700 tabular-nums">
                    <Calendar className="w-4 h-4" />
                    <span>{selectedEvent.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-teal-700 tabular-nums">
                    <Clock className="w-4 h-4" />
                    <span>{selectedEvent.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-teal-700">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedEvent.location}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-stone-800 text-sm">Deskripsi Kegiatan</h4>
                <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line">
                  {selectedEvent.description}
                </p>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1">
                <div>
                  <strong className="text-stone-900">Penyelenggara:</strong> {selectedEvent.organizer}
                </div>
                {selectedEvent.targetAudience && (
                  <div>
                    <strong className="text-stone-900">Peserta:</strong> {selectedEvent.targetAudience}
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-stone-200 bg-stone-50 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-stone-500">
                Pendaftaran &amp; Konfirmasi Kehadiran
              </span>
              {selectedEvent.registrationUrl ? (
                <a
                  href={selectedEvent.registrationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-micro inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 px-5 py-2.5 rounded-xl font-bold text-sm min-h-[42px]"
                >
                  <span>Daftar Sekarang</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <a
                  href="https://wa.me/6282258570582?text=Halo%20Admin%20saya%20ingin%20mendaftar%20kegiatan%20ini"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-micro inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm min-h-[42px]"
                >
                  <span>Daftar via WhatsApp</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
