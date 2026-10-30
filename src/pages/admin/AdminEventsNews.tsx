import React, { useState, useRef } from 'react';
import { ForumEvent, Article } from '../../types';
import { dbService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { compressImage } from '../../utils/image';
import {
  Calendar,
  Newspaper,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  Archive,
  Clock,
  MapPin,
  X,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
} from 'lucide-react';

interface AdminEventsNewsProps {
  events: ForumEvent[];
  articles: Article[];
  onRefresh: () => void;
  openAddEventInitially?: boolean;
}

export const AdminEventsNews: React.FC<AdminEventsNewsProps> = ({
  events,
  articles,
  onRefresh,
  openAddEventInitially = false,
}) => {
  const { profile, canManageEventsNews } = useAuth();
  const [section, setSection] = useState<'events' | 'articles'>('events');

  // File upload refs and compression states
  const eventPosterRef = useRef<HTMLInputElement>(null);
  const articleImageRef = useRef<HTMLInputElement>(null);
  const [isCompressingEvent, setIsCompressingEvent] = useState(false);
  const [isCompressingArticle, setIsCompressingArticle] = useState(false);

  // Event modal state
  const [eventModalOpen, setEventModalOpen] = useState(openAddEventInitially);
  const [editingEvent, setEditingEvent] = useState<ForumEvent | null>(null);
  const [eventForm, setEventForm] = useState<Omit<ForumEvent, 'id'>>({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '09.00 - 15.00 WIB',
    location: '',
    organizer: 'Forum UMKM KUAT Kecamatan Tangerang',
    posterUrl: '',
    documentationUrls: '',
    status: 'terbit',
    targetAudience: 'Pelaku UMKM Kecamatan Tangerang',
    registrationUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Article modal state
  const [articleModalOpen, setArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [articleForm, setArticleForm] = useState<Omit<Article, 'id'>>({
    title: '',
    excerpt: '',
    content: '',
    category: 'Kabar Kecamatan',
    author: profile?.displayName || 'Tim Redaksi Forum UMKM KUAT',
    authorId: profile?.uid || 'usr-admin',
    imageUrl: '',
    publishedDate: new Date().toISOString().split('T')[0],
    status: 'terbit',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Image Upload Handlers with auto-compression
  const handleEventPosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressingEvent(true);
      const compressed = await compressImage(file, 1000, 750, 0.82);
      setEventForm((prev) => ({
        ...prev,
        posterUrl: compressed,
      }));
    } catch (err: any) {
      alert('Gagal memproses gambar poster: ' + (err?.message || 'Format tidak didukung'));
    } finally {
      setIsCompressingEvent(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleArticleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressingArticle(true);
      const compressed = await compressImage(file, 1000, 750, 0.82);
      setArticleForm((prev) => ({
        ...prev,
        imageUrl: compressed,
      }));
    } catch (err: any) {
      alert('Gagal memproses gambar sampul berita: ' + (err?.message || 'Format tidak didukung'));
    } finally {
      setIsCompressingArticle(false);
      if (e.target) e.target.value = '';
    }
  };

  // Event handlers
  const handleOpenAddEvent = () => {
    setEditingEvent(null);
    setEventForm({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      time: '09.00 - 15.00 WIB',
      location: 'Aula Kantor Kecamatan Tangerang',
      organizer: 'Forum UMKM KUAT Kecamatan Tangerang',
      posterUrl: '',
      documentationUrls: '',
      status: 'terbit',
      targetAudience: 'Pelaku UMKM dan Masyarakat',
      registrationUrl: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setEventModalOpen(true);
  };

  const handleOpenEditEvent = (evt: ForumEvent) => {
    setEditingEvent(evt);
    setEventForm({
      title: evt.title,
      description: evt.description,
      date: evt.date,
      time: evt.time,
      location: evt.location,
      organizer: evt.organizer,
      posterUrl: evt.posterUrl || '',
      documentationUrls: evt.documentationUrls || '',
      status: evt.status,
      targetAudience: evt.targetAudience || '',
      registrationUrl: evt.registrationUrl || '',
      createdAt: evt.createdAt,
      updatedAt: new Date().toISOString(),
    });
    setEventModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingEvent ? editingEvent.id : 'evt-' + Date.now();
    const eventToSave: ForumEvent = {
      id,
      ...eventForm,
      updatedAt: new Date().toISOString(),
    };

    await dbService.saveEvent(eventToSave);
    await dbService.addLog({
      userId: profile?.uid || 'usr-admin',
      userName: profile?.displayName || 'Admin Informasi',
      action: editingEvent ? 'Ubah Agenda Kegiatan' : 'Buat Agenda Kegiatan Baru',
      target: eventToSave.title,
      details: `Status: ${eventToSave.status} | Tanggal: ${eventToSave.date}`,
    });

    setEventModalOpen(false);
    onRefresh();
  };

  const handleDeleteEvent = async (evt: ForumEvent) => {
    if (confirm(`Hapus agenda kegiatan "${evt.title}"?`)) {
      await dbService.deleteEvent(evt.id);
      await dbService.addLog({
        userId: profile?.uid || 'usr-admin',
        userName: profile?.displayName || 'Admin',
        action: 'Hapus Agenda Kegiatan',
        target: evt.title,
        details: 'Menghapus data agenda',
      });
      onRefresh();
    }
  };

  // Article handlers
  const handleOpenAddArticle = () => {
    setEditingArticle(null);
    setArticleForm({
      title: '',
      excerpt: '',
      content: '',
      category: 'Kabar Kecamatan',
      author: profile?.displayName || 'Tim Redaksi Forum UMKM KUAT',
      authorId: profile?.uid || 'usr-admin',
      imageUrl: '',
      publishedDate: new Date().toISOString().split('T')[0],
      status: 'terbit',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setArticleModalOpen(true);
  };

  const handleOpenEditArticle = (art: Article) => {
    setEditingArticle(art);
    setArticleForm({
      title: art.title,
      excerpt: art.excerpt,
      content: art.content,
      category: art.category,
      author: art.author,
      authorId: art.authorId,
      imageUrl: art.imageUrl || '',
      publishedDate: art.publishedDate,
      status: art.status,
      createdAt: art.createdAt,
      updatedAt: new Date().toISOString(),
    });
    setArticleModalOpen(true);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingArticle ? editingArticle.id : 'art-' + Date.now();
    const articleToSave: Article = {
      id,
      ...articleForm,
      updatedAt: new Date().toISOString(),
    };

    await dbService.saveArticle(articleToSave);
    await dbService.addLog({
      userId: profile?.uid || 'usr-admin',
      userName: profile?.displayName || 'Admin Informasi',
      action: editingArticle ? 'Ubah Artikel Berita' : 'Terbitkan Artikel Baru',
      target: articleToSave.title,
      details: `Kategori: ${articleToSave.category} | Status: ${articleToSave.status}`,
    });

    setArticleModalOpen(false);
    onRefresh();
  };

  const handleDeleteArticle = async (art: Article) => {
    if (confirm(`Hapus artikel berita "${art.title}"?`)) {
      await dbService.deleteArticle(art.id);
      await dbService.addLog({
        userId: profile?.uid || 'usr-admin',
        userName: profile?.displayName || 'Admin',
        action: 'Hapus Artikel',
        target: art.title,
        details: 'Menghapus publikasi',
      });
      onRefresh();
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header & Tab Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Publikasi Event & Kabar Berita
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Hanya konten berstatus <strong>Terbit</strong> yang akan ditampilkan kepada masyarakat di portal publik.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {section === 'events' ? (
            <button
              onClick={handleOpenAddEvent}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Kegiatan Baru</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAddArticle}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tulis Berita Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Segmented Control */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setSection('events')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            section === 'events'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Agenda & Kegiatan ({events.length})</span>
        </button>

        <button
          onClick={() => setSection('articles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            section === 'articles'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>Kabar Berita & Edukasi ({articles.length})</span>
        </button>
      </div>

      {/* SECTION 1: EVENTS LIST */}
      {section === 'events' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Nama Kegiatan</th>
                  <th className="px-4 py-3.5">Jadwal & Waktu</th>
                  <th className="px-4 py-3.5">Lokasi</th>
                  <th className="px-4 py-3.5">Penyelenggara</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Belum ada agenda kegiatan yang dibuat.
                    </td>
                  </tr>
                ) : (
                  events.map((evt) => (
                    <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{evt.title}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {evt.description}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{evt.date}</div>
                        <div className="text-[11px] text-slate-400">{evt.time}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{evt.location}</td>
                      <td className="px-4 py-3 text-slate-600">{evt.organizer}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                            evt.status === 'terbit'
                              ? 'bg-green-100 text-green-800'
                              : evt.status === 'selesai'
                              ? 'bg-blue-100 text-blue-800'
                              : evt.status === 'draf'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {evt.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditEvent(evt)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                            title="Ubah"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(evt)}
                            className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: ARTICLES LIST */}
      {section === 'articles' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Judul Artikel Berita</th>
                  <th className="px-4 py-3.5">Kategori</th>
                  <th className="px-4 py-3.5">Penulis</th>
                  <th className="px-4 py-3.5">Tanggal</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {articles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Belum ada kabar berita yang diterbitkan.
                    </td>
                  </tr>
                ) : (
                  articles.map((art) => (
                    <tr key={art.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{art.title}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {art.excerpt}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium text-[11px]">
                          {art.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{art.author}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{art.publishedDate}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                            art.status === 'terbit'
                              ? 'bg-green-100 text-green-800'
                              : art.status === 'draf'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {art.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditArticle(art)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                            title="Ubah"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteArticle(art)}
                            className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL EVENT */}
      {eventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-900 text-lg">
                {editingEvent ? 'Ubah Agenda Kegiatan' : 'Buat Agenda Kegiatan Baru'}
              </h3>
              <button onClick={() => setEventModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama / Judul Kegiatan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="Contoh: Bazar Ramadhan Cisadane 2026"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Pelaksanaan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Waktu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={eventForm.time}
                    onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                    placeholder="08.30 - 15.00 WIB"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lokasi Tempat Acara <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  placeholder="Aula Kantor Kecamatan / Bantaran Cisadane"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi Lengkap Kegiatan <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Rincian acara, susunan agenda, benefit peserta..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              {/* GAMBAR POSTER / SAMPUL KEGIATAN */}
              <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Foto / Gambar Poster Kegiatan
                  </label>
                  {eventForm.posterUrl && (
                    <button
                      type="button"
                      onClick={() => setEventForm({ ...eventForm, posterUrl: '' })}
                      className="text-[11px] font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus Foto
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
                  {/* Thumbnail Preview */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xs relative group">
                    {eventForm.posterUrl ? (
                      <img
                        src={eventForm.posterUrl}
                        alt="Preview Poster"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <ImageIcon className="w-7 h-7 mx-auto mb-1 text-slate-300" />
                        <span className="text-[10px] block leading-tight font-medium">Belum ada foto</span>
                      </div>
                    )}
                    {isCompressingEvent && (
                      <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-[10px] font-bold">
                        Memproses...
                      </div>
                    )}
                  </div>

                  {/* Actions & URL Input */}
                  <div className="flex-1 w-full space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={isCompressingEvent}
                        onClick={() => eventPosterRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isCompressingEvent ? 'Mengompres Foto...' : eventForm.posterUrl ? 'Ganti Foto' : 'Upload Foto Poster'}</span>
                      </button>
                      <input
                        ref={eventPosterRef}
                        type="file"
                        accept="image/*"
                        onChange={handleEventPosterUpload}
                        className="hidden"
                      />
                      <span className="text-[11px] text-slate-500 font-medium">
                        JPG, PNG, WebP (otomatis dikompres)
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Atau Masukkan / Edit URL Gambar:
                      </label>
                      <div className="relative">
                        <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={eventForm.posterUrl}
                          onChange={(e) => setEventForm({ ...eventForm, posterUrl: e.target.value })}
                          placeholder="https://contoh-gambar.com/poster.jpg atau unggah foto"
                          className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Publikasi
                </label>
                <select
                  value={eventForm.status}
                  onChange={(e) => setEventForm({ ...eventForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold"
                >
                  <option value="terbit">Terbit (Muncul di Website Publik)</option>
                  <option value="draf">Draf (Hanya Admin)</option>
                  <option value="selesai">Selesai</option>
                  <option value="arsip">Arsip</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Simpan Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ARTICLE */}
      {articleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-900 text-lg">
                {editingArticle ? 'Ubah Artikel Berita' : 'Tulis Artikel Berita Baru'}
              </h3>
              <button onClick={() => setArticleModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Berita / Publikasi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={articleForm.title}
                  onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                  placeholder="Contoh: Sosialisasi NIB OSS di Kantor Kecamatan..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Berita <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={articleForm.category}
                    onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium"
                  >
                    <option value="Kabar Kecamatan">Kabar Kecamatan</option>
                    <option value="Edukasi Bisnis">Edukasi Bisnis</option>
                    <option value="Inspirasi Usaha">Inspirasi Usaha</option>
                    <option value="Pengumuman">Pengumuman</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Penulis
                  </label>
                  <input
                    type="text"
                    value={articleForm.author}
                    onChange={(e) => setArticleForm({ ...articleForm, author: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ringkasan Singkat (Excerpt) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={articleForm.excerpt}
                  onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
                  placeholder="Ringkasan 1-2 kalimat..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Isi Lengkap Berita <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  value={articleForm.content}
                  onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                  placeholder="Tuliskan berita lengkap di sini..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              {/* GAMBAR SAMPUL ARTIKEL BERITA */}
              <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Foto / Gambar Sampul Artikel
                  </label>
                  {articleForm.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setArticleForm({ ...articleForm, imageUrl: '' })}
                      className="text-[11px] font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus Foto
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
                  {/* Thumbnail Preview */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xs relative group">
                    {articleForm.imageUrl ? (
                      <img
                        src={articleForm.imageUrl}
                        alt="Preview Sampul"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <ImageIcon className="w-7 h-7 mx-auto mb-1 text-slate-300" />
                        <span className="text-[10px] block leading-tight font-medium">Belum ada foto</span>
                      </div>
                    )}
                    {isCompressingArticle && (
                      <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-[10px] font-bold">
                        Memproses...
                      </div>
                    )}
                  </div>

                  {/* Actions & URL Input */}
                  <div className="flex-1 w-full space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={isCompressingArticle}
                        onClick={() => articleImageRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isCompressingArticle ? 'Mengompres Foto...' : articleForm.imageUrl ? 'Ganti Foto' : 'Upload Foto Sampul'}</span>
                      </button>
                      <input
                        ref={articleImageRef}
                        type="file"
                        accept="image/*"
                        onChange={handleArticleImageUpload}
                        className="hidden"
                      />
                      <span className="text-[11px] text-slate-500 font-medium">
                        JPG, PNG, WebP (otomatis dikompres)
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Atau Masukkan / Edit URL Gambar:
                      </label>
                      <div className="relative">
                        <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={articleForm.imageUrl}
                          onChange={(e) => setArticleForm({ ...articleForm, imageUrl: e.target.value })}
                          placeholder="https://contoh-gambar.com/sampul-berita.jpg atau unggah foto"
                          className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Publikasi
                </label>
                <select
                  value={articleForm.status}
                  onChange={(e) => setArticleForm({ ...articleForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold"
                >
                  <option value="terbit">Terbit (Tampil di Publik)</option>
                  <option value="draf">Draf (Hanya Admin)</option>
                  <option value="arsip">Arsip</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setArticleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Simpan & Terbitkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
