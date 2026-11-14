import React, { useState } from 'react';
import { Article } from '../../types';
import { DEFAULT_PRODUCT_PHOTO_PLACEHOLDER } from '../../utils/excelImport';
import {
  Newspaper,
  Search,
  Calendar,
  User,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  EventNewsCardSkeleton,
  ShimmerImage,
} from '../../components/common/Skeleton';

interface NewsPageProps {
  articles: Article[];
  isLoading?: boolean;
  selectedArticle: Article | null;
  setSelectedArticle: (article: Article | null) => void;
}

export const NewsPage: React.FC<NewsPageProps> = ({
  articles,
  isLoading = false,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
      {/* Page Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700 block">
          Informasi & Berita Terkini
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight">
          Kabar Berita & Edukasi Usaha
        </h1>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
          Dapatkan wawasan seputar program sertifikasi halal gratis, tips foto produk e-commerce, kebijakan pemerintah, dan kabar bazar UMKM di Kecamatan Tangerang.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari artikel berita..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-teal-600 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`btn-micro px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-teal-700 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Semua Kategori
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`btn-micro px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-teal-700 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {isLoading && articles.length === 0 ? (
        <EventNewsCardSkeleton count={6} />
      ) : filteredArticles.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 space-y-3">
          <Newspaper className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-bold text-stone-800 text-lg">Tidak Ada Berita Ditemukan</h3>
          <p className="text-stone-500 text-sm">Coba kata kunci pencarian yang lain.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((art) => (
            <article
              key={art.id}
              onClick={() => setSelectedArticle(art)}
              className="card-hover-interactive bg-white rounded-2xl border border-stone-200 overflow-hidden group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="relative aspect-[16/10] w-full bg-stone-100 overflow-hidden border-b border-stone-200">
                  <ShimmerImage
                    src={art.imageUrl || DEFAULT_PRODUCT_PHOTO_PLACEHOLDER}
                    fallbackSrc={DEFAULT_PRODUCT_PHOTO_PLACEHOLDER}
                    alt={art.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  />
                  <div className="absolute top-3 left-3 bg-[#121918] text-teal-300 border border-stone-700 text-[11px] font-semibold px-2.5 py-1 rounded-md">
                    {art.category}
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-stone-500 tabular-nums">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-700" />
                      <span>{art.publishedDate}</span>
                    </span>
                    <span>&bull;</span>
                    <span className="line-clamp-1">{art.author}</span>
                  </div>

                  <h3 className="font-bold text-stone-900 text-lg group-hover:text-teal-700 transition-colors duration-200 line-clamp-2 leading-snug">
                    {art.title}
                  </h3>

                  <p className="text-stone-600 text-sm line-clamp-3 leading-relaxed">
                    {art.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0 flex items-center text-teal-700 font-bold text-xs">
                <span>Baca Artikel Lengkap</span>
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ARTICLE READER MODAL */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/65 animate-in fade-in">
          <div className="bg-white w-full max-w-3xl rounded-2xl overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <span className="text-xs font-bold text-teal-800 uppercase bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
                {selectedArticle.category}
              </span>
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-stone-500 hover:text-stone-900 p-1.5 rounded-lg hover:bg-stone-200/70 transition-colors cursor-pointer"
                aria-label="Tutup Artikel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 leading-tight tracking-tight">
                  {selectedArticle.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 mt-3 pt-3 border-t border-stone-200 tabular-nums">
                  <span className="flex items-center gap-1.5 font-semibold text-stone-700">
                    <User className="w-3.5 h-3.5 text-teal-700" />
                    <span>Penulis: {selectedArticle.author}</span>
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-700" />
                    <span>Diterbitkan: {selectedArticle.publishedDate}</span>
                  </span>
                </div>
              </div>

              {selectedArticle.imageUrl && (
                <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                  <img
                    src={selectedArticle.imageUrl}
                    alt={selectedArticle.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (img.src !== DEFAULT_PRODUCT_PHOTO_PLACEHOLDER) {
                        img.src = DEFAULT_PRODUCT_PHOTO_PLACEHOLDER;
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="prose prose-stone max-w-none text-stone-700 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                {selectedArticle.content}
              </div>
            </div>

            <div className="p-5 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
              <span className="text-xs text-stone-500 font-medium">
                Forum UMKM KUAT Kecamatan Tangerang
              </span>
              <button
                onClick={() => setSelectedArticle(null)}
                className="bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
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
