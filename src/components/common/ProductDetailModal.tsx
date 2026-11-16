import React, { useState, useEffect } from 'react';
import { Member } from '../../types';
import { getMemberProductPhotos } from '../../utils/image';
import { DEFAULT_PRODUCT_PHOTO_PLACEHOLDER } from '../../utils/excelImport';
import { ShimmerImage } from './Skeleton';
import {
  MapPin,
  Phone,
  X,
  ExternalLink,
  Instagram,
  Globe,
  ShoppingBag,
} from 'lucide-react';
import { TikTokIcon, formatSocialUrl } from './SocialIcons';

interface ProductDetailModalProps {
  member: Member | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  member,
  onClose,
}) => {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  useEffect(() => {
    setActivePhotoIndex(0);
  }, [member?.id]);

  if (!member) return null;

  const photos = getMemberProductPhotos(member);
  const slides = photos.length > 0 ? photos : [DEFAULT_PRODUCT_PHOTO_PLACEHOLDER];
  const currentSrc = slides[activePhotoIndex] || slides[0];
  const soldCount = Math.max(0, Number(member.soldCount ?? 0));
  const waNum = (member.businessPhone || member.phone || '').replace(/\D/g, '').replace(/^0/, '62');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/65 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <span className="bg-teal-700 text-white text-xs font-bold px-2.5 py-0.5 rounded-md">
              {member.category}
            </span>
            <span className="text-xs text-stone-500 font-mono tabular-nums">
              {member.memberNumber}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-micro text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200 cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Product Gallery (Main Square/Landscape + Clickable Thumbnails) */}
          <div className="space-y-2.5">
            <div className="relative aspect-square sm:aspect-[4/3] max-h-80 w-full rounded-xl overflow-hidden bg-stone-100 border border-stone-200 mx-auto">
              <ShimmerImage
                src={currentSrc}
                fallbackSrc={DEFAULT_PRODUCT_PHOTO_PLACEHOLDER}
                alt={`${member.businessName} - Foto ${activePhotoIndex + 1}`}
                className="w-full h-full object-cover"
              />
              {slides.length > 1 && (
                <span className="absolute bottom-2.5 right-2.5 bg-[#121918]/80 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md tabular-nums">
                  {activePhotoIndex + 1} / {slides.length}
                </span>
              )}
            </div>

            {slides.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {slides.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIndex(idx)}
                    aria-label={`Pilih foto produk ${idx + 1}`}
                    className={`relative w-14 h-14 flex-shrink-0 aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                      idx === activePhotoIndex
                        ? 'border-teal-700 ring-2 ring-teal-700/20'
                        : 'border-stone-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={src}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover block"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-stone-900">
                {member.businessName}
              </h2>
              <div className="flex items-center gap-2 text-sm text-teal-700 font-medium mt-1">
                <MapPin className="w-4 h-4" />
                <span>Kelurahan {member.kelurahan}, Kecamatan Tangerang</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-xl text-xs font-bold tabular-nums">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
              <span>Terjual {soldCount.toLocaleString('id-ID')} produk</span>
            </div>
          </div>

          {/* Specs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200 text-sm">
            <div>
              <span className="text-xs text-stone-500 font-semibold uppercase">Produk Unggulan</span>
              <div className="font-bold text-stone-900 mt-0.5">{member.topProduct}</div>
            </div>
            <div>
              <span className="text-xs text-stone-500 font-semibold uppercase">Nama Pemilik</span>
              <div className="font-bold text-stone-900 mt-0.5">{member.fullName}</div>
            </div>
            <div>
              <span className="text-xs text-stone-500 font-semibold uppercase">Alamat Usaha</span>
              <div className="text-stone-700 mt-0.5">{member.businessAddress}</div>
            </div>
            <div>
              <span className="text-xs text-stone-500 font-semibold uppercase">Status Legalitas</span>
              <div className="text-teal-700 font-semibold mt-0.5">
                {member.legalities || 'Dalam Proses'}
              </div>
            </div>
          </div>

          {/* Media Sosial & Website Usaha */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
              Media Sosial &amp; Website Usaha
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {member.instagram ? (
                <a
                  href={formatSocialUrl(member.instagram, 'instagram')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/soc flex items-center gap-2.5 p-3 rounded-xl bg-white hover:bg-rose-50/60 border border-stone-200 hover:border-rose-300 transition-colors min-w-0"
                >
                  <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center flex-shrink-0">
                    <Instagram className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase text-stone-400">Instagram</div>
                    <div className="text-xs font-bold text-stone-800 group-hover/soc:text-rose-700 truncate">
                      {member.instagram}
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover/soc:text-rose-600 flex-shrink-0" />
                </a>
              ) : (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200/80 opacity-65 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-stone-100 border border-stone-200 text-stone-400 flex items-center justify-center flex-shrink-0">
                    <Instagram className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase text-stone-400">Instagram</div>
                    <div className="text-xs text-stone-400 truncate">Belum dicantumkan</div>
                  </div>
                </div>
              )}

              {member.tiktok ? (
                <a
                  href={formatSocialUrl(member.tiktok, 'tiktok')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/soc flex items-center gap-2.5 p-3 rounded-xl bg-white hover:bg-stone-100/80 border border-stone-200 hover:border-stone-400 transition-colors min-w-0"
                >
                  <div className="w-9 h-9 rounded-lg bg-stone-900 border border-stone-800 text-white flex items-center justify-center flex-shrink-0">
                    <TikTokIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase text-stone-400">TikTok</div>
                    <div className="text-xs font-bold text-stone-800 truncate">
                      {member.tiktok}
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover/soc:text-stone-700 flex-shrink-0" />
                </a>
              ) : (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200/80 opacity-65 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-stone-100 border border-stone-200 text-stone-400 flex items-center justify-center flex-shrink-0">
                    <TikTokIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase text-stone-400">TikTok</div>
                    <div className="text-xs text-stone-400 truncate">Belum dicantumkan</div>
                  </div>
                </div>
              )}

              {member.website ? (
                <a
                  href={formatSocialUrl(member.website, 'website')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/soc flex items-center gap-2.5 p-3 rounded-xl bg-white hover:bg-teal-50/70 border border-stone-200 hover:border-teal-300 transition-colors min-w-0"
                >
                  <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase text-stone-400">Website</div>
                    <div className="text-xs font-bold text-stone-800 group-hover/soc:text-teal-800 truncate">
                      {member.website.replace(/^https?:\/\//i, '')}
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover/soc:text-teal-700 flex-shrink-0" />
                </a>
              ) : (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200/80 opacity-65 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-stone-100 border border-stone-200 text-stone-400 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase text-stone-400">Website</div>
                    <div className="text-xs text-stone-400 truncate">Belum dicantumkan</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-stone-200 bg-stone-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-stone-600 font-medium tabular-nums">
            <ShoppingBag className="w-4 h-4 text-amber-600" />
            <span>
              Total Terjual: <strong className="text-stone-900">{soldCount.toLocaleString('id-ID')} produk</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!waNum) return;
              window.open(
                `https://wa.me/${waNum}?text=Halo%20${encodeURIComponent(
                  member.businessName
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
  );
};
