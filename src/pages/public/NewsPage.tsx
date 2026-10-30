import React, { useState } from 'react';
import { Article } from '../../types';
import {
  Newspaper,
  Search,
  Calendar,
  User,
  ChevronRight,
  X,
  Share2,
  Bookmark,
  Sparkles,
} from 'lucide-react';

interface NewsPageProps {
  articles: Article[];
  selectedArticle: Article | null;
  setSelectedArticle: (article: Article | null) => void;
}

export const NewsPage: React.FC<NewsPageProps> = ({
  articles,
  selectedArticle,
  setSelectedArticle,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Only show published articles in public
  const publishedArticles = articles.filter((a) => a.status === 'terbit');

  const categories = Array.from(new Set(publishedArticles.map((a) => a.category)));

  const filteredArticles = publishedArticles.filter((a) => {
    const matchSearch =
      search === '' ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === 'all' || a.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Page Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider">
          <Newspaper className="w-3.5 h-3.5 text-teal-600" />
          <span>Informasi & Berita Terkini</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Kabar Berita & Edukasi Usaha
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Dapatkan wawasan seputar program sertifikasi halal gratis, tips foto produk e-commerce, kebijakan pemerintah, dan kabar bazar UMKM di Kecamatan Tangerang.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari artikel berita..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:outline-hidden focus:border-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Kategori
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <Newspaper className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-lg">Tidak Ada Berita Ditemukan</h3>
          <p className="text-slate-500 text-sm">Coba kata kunci pencarian yang lain.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((art) => (
            <article
              key={art.id}
              onClick={() => setSelectedArticle(art)}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={
                      art.imageUrl ||
                      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={art.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-teal-300 text-xs font-semibold px-2.5 py-1 rounded-md">
                    {art.category}
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      <span>{art.publishedDate}</span>
                    </span>
                    <span>&bull;</span>
                    <span className="line-clamp-1">{art.author}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-lg group-hover:text-teal-600 transition-colors line-clamp-2">
                    {art.title}
                  </h3>

                  <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
                    {art.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0 flex items-center text-teal-700 font-bold text-xs group-hover:translate-x-1 transition-transform">
                <span>Baca Artikel Lengkap</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ARTICLE READER MODAL */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="text-xs font-bold text-teal-700 uppercase bg-teal-100/70 px-2.5 py-1 rounded">
                {selectedArticle.category}
              </span>
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {selectedArticle.title}
                </h1>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <User className="w-3.5 h-3.5 text-teal-600" />
                    <span>Penulis: {selectedArticle.author}</span>
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    <span>Diterbitkan: {selectedArticle.publishedDate}</span>
                  </span>
                </div>
              </div>

              {selectedArticle.imageUrl && (
                <div className="relative h-72 w-full rounded-2xl overflow-hidden bg-slate-100">
                  <img
                    src={selectedArticle.imageUrl}
                    alt={selectedArticle.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                {selectedArticle.content}
              </div>
            </div>

            <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Forum UMKM KUAT Kecamatan Tangerang
              </span>
              <button
                onClick={() => setSelectedArticle(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors"
              >
                Tutup Bacaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
