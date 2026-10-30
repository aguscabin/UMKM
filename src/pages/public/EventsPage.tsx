import React, { useState } from 'react';
import { ForumEvent } from '../../types';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  X,
  Share2,
} from 'lucide-react';

interface EventsPageProps {
  events: ForumEvent[];
  selectedEvent: ForumEvent | null;
  setSelectedEvent: (event: ForumEvent | null) => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({
  events,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
          Agenda & Pelatihan
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Event & Kegiatan Forum UMKM KUAT
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Ikuti berbagai agenda bazar tahunan, workshop legalitas NIB & Halal, pelatihan pemasaran digital, dan temu bisnis di Kecamatan Tangerang.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kegiatan atau lokasi..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:outline-hidden focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({publicEvents.length})
          </button>
          <button
            onClick={() => setFilter('terbit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filter === 'terbit'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Mendatang
          </button>
          <button
            onClick={() => setFilter('selesai')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filter === 'selesai'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Telah Selesai
          </button>
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-lg">Tidak Ada Kegiatan Ditemukan</h3>
          <p className="text-slate-500 text-sm">Silakan ubah kata kunci atau filter status kegiatan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              onClick={() => setSelectedEvent(evt)}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="relative h-52 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={
                      evt.posterUrl ||
                      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-md shadow-xs">
                    {evt.date}
                  </div>
                  {evt.status === 'selesai' && (
                    <div className="absolute top-3 right-3 bg-slate-900/80 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded">
                      Selesai
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-3">
                  <h3 className="font-bold text-slate-900 text-lg group-hover:text-teal-600 transition-colors line-clamp-2">
                    {evt.title}
                  </h3>
                  <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
                    {evt.description}
                  </p>
                  <div className="pt-2 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                      <span>{evt.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                      <span className="line-clamp-1">{evt.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <span className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-teal-50 group-hover:bg-teal-600 text-teal-700 group-hover:text-white font-semibold text-xs transition-colors">
                  <span>Lihat Selengkapnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EVENT DETAIL MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="text-xs font-bold text-orange-600 uppercase bg-orange-100/70 px-2.5 py-1 rounded">
                Agenda Forum UMKM KUAT
              </span>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="relative h-64 w-full rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={
                    selectedEvent.posterUrl ||
                    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900">{selectedEvent.title}</h2>
                <div className="flex flex-wrap gap-4 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 font-semibold text-teal-700">
                    <Calendar className="w-4 h-4" />
                    <span>{selectedEvent.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-teal-700">
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
                <h4 className="font-bold text-slate-800 text-sm">Deskripsi Kegiatan</h4>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                  {selectedEvent.description}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div>
                  <strong className="text-slate-800">Penyelenggara:</strong> {selectedEvent.organizer}
                </div>
                {selectedEvent.targetAudience && (
                  <div>
                    <strong className="text-slate-800">Peserta:</strong> {selectedEvent.targetAudience}
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Pendaftaran & Konfirmasi Kehadiran
              </span>
              {selectedEvent.registrationUrl ? (
                <a
                  href={selectedEvent.registrationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors"
                >
                  <span>Daftar Sekarang</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <a
                  href="https://wa.me/6285880942565?text=Halo%20Admin%20saya%20ingin%20mendaftar%20kegiatan%20ini"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors"
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
