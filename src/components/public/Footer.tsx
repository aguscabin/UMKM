import React, { useState, useEffect } from 'react';
import { UmkmKuatLogo } from '../UmkmKuatLogo';
import { KELURAHAN_LIST, OrgContactInfo } from '../../types';
import { dbService, INITIAL_CONTACT_INFO } from '../../services/db';
import { MapPin, Phone, Mail, Clock, ShieldCheck, ExternalLink, Instagram, Youtube, Facebook } from 'lucide-react';
import { TikTokIcon, formatSocialUrl } from '../common/SocialIcons';

interface FooterProps {
  setCurrentTab: (tab: string) => void;
  openLoginModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentTab, openLoginModal }) => {
  const [contactInfo, setContactInfo] = useState<OrgContactInfo>(INITIAL_CONTACT_INFO);

  useEffect(() => {
    const loadContact = async () => {
      try {
        const data = await dbService.getContactInfo();
        if (data) setContactInfo(data);
      } catch (e) {
        // silent fallback
      }
    };
    loadContact();

    // Subscribe to realtime contact_info updates from Firestore
    const unsubscribe = dbService.subscribeContactInfo((data) => {
      if (data) setContactInfo(data);
    });

    // Also listen to in-window custom update event
    const handleUpdate = (e: any) => {
      if (e.detail) setContactInfo(e.detail);
    };
    window.addEventListener('umkm_contact_info_updated', handleUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('umkm_contact_info_updated', handleUpdate);
    };
  }, []);

  return (
    <footer className="bg-[#121918] text-stone-300 pt-20 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-14">
          {/* Col 1: Brand & About & Social Media Icons */}
          <div className="space-y-4">
            <UmkmKuatLogo size="lg" variant="full" theme="light" />
            <p className="text-sm text-stone-400 leading-relaxed font-normal">
              Wadah kolaborasi, pembinaan, legalitas usaha, dan pemasaran produk Usaha Mikro, Kecil, dan Menengah binaan Kecamatan Tangerang, Kota Tangerang.
            </p>
            <div className="inline-flex items-center gap-2 bg-stone-900 px-3 py-1.5 rounded-lg border border-stone-800 text-xs text-teal-300">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Mitra Resmi Kecamatan Tangerang</span>
            </div>

            {/* Social Media Icons (Instagram, TikTok, YouTube, Facebook) */}
            {(contactInfo.instagram || contactInfo.tiktok || contactInfo.youtube || contactInfo.facebook) && (
              <div className="pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2.5">
                  Media Sosial Resmi
                </div>
                <div className="flex items-center gap-2.5">
                  {contactInfo.instagram && (
                    <a
                      href={formatSocialUrl(contactInfo.instagram, 'instagram')}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram Forum UMKM KUAT"
                      className="w-9 h-9 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center border border-stone-800 hover:border-stone-700 transition-colors"
                      title={`Instagram: ${contactInfo.instagram}`}
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}

                  {contactInfo.tiktok && (
                    <a
                      href={formatSocialUrl(contactInfo.tiktok, 'tiktok')}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="TikTok Forum UMKM KUAT"
                      className="w-9 h-9 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center border border-stone-800 hover:border-stone-700 transition-colors"
                      title={`TikTok: ${contactInfo.tiktok}`}
                    >
                      <TikTokIcon className="w-4 h-4" />
                    </a>
                  )}

                  {contactInfo.youtube && (
                    <a
                      href={formatSocialUrl(contactInfo.youtube, 'youtube')}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="YouTube Forum UMKM KUAT"
                      className="w-9 h-9 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center border border-stone-800 hover:border-stone-700 transition-colors"
                      title={`YouTube: ${contactInfo.youtube}`}
                    >
                      <Youtube className="w-4 h-4" />
                    </a>
                  )}

                  {contactInfo.facebook && (
                    <a
                      href={formatSocialUrl(contactInfo.facebook, 'facebook')}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook Forum UMKM KUAT"
                      className="w-9 h-9 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center border border-stone-800 hover:border-stone-700 transition-colors"
                      title={`Facebook: ${contactInfo.facebook}`}
                    >
                      <Facebook className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Col 2: 8 Kelurahan Binaan */}
          <div>
            <h4 className="text-white font-bold text-xs tracking-widest uppercase mb-4">
              8 Kelurahan Binaan
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {KELURAHAN_LIST.map((kel) => (
                <button
                  key={kel}
                  onClick={() => {
                    setCurrentTab('direktori');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-left text-stone-400 hover:text-teal-300 transition-colors py-1 cursor-pointer"
                >
                  {kel}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-stone-500 mt-4 leading-relaxed font-normal">
              Menjangkau seluruh pelaku usaha mikro dan kecil se-Kecamatan Tangerang.
            </p>
          </div>

          {/* Col 3: Navigasi Cepat */}
          <div>
            <h4 className="text-white font-bold text-xs tracking-widest uppercase mb-4">
              Layanan Publik
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => {
                    setCurrentTab('profil');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Profil & Struktur Forum
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentTab('direktori');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Katalog Direktori UMKM
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentTab('event');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Jadwal Event & Pelatihan
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentTab('berita');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Kabar Berita & Edukasi Usaha
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentTab('kontak');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Pusat Bantuan & Pengaduan
                </button>
              </li>
              <li className="pt-2">
                <button
                  onClick={openLoginModal}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Portal Login Pengurus / Admin</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Sekretariat & Kontak */}
          <div className="space-y-3.5 text-sm">
            <h4 className="text-white font-black text-xs tracking-widest uppercase mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
              Sekretariat Forum
            </h4>
            <div className="flex items-start gap-2.5 text-slate-400 text-xs sm:text-sm">
              <MapPin className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{contactInfo.address}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-400 text-xs sm:text-sm">
              <Phone className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <span>
                {contactInfo.phone && <a href={`tel:${contactInfo.phone.replace(/[^0-9]/g, '')}`} className="hover:text-teal-300">{contactInfo.phone}</a>}
                {contactInfo.phone && contactInfo.whatsapp && ' / '}
                {contactInfo.whatsapp && (
                  <a
                    href={`https://wa.me/${(contactInfo.whatsapp || '').replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-teal-300"
                  >
                    WA {contactInfo.whatsapp}
                  </a>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-400 text-xs sm:text-sm">
              <Mail className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <a href={`mailto:${contactInfo.email}`} className="hover:text-teal-300 transition-colors">
                {contactInfo.email}
              </a>
            </div>
            <div className="flex items-center gap-2.5 text-slate-400 text-xs">
              <Clock className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <span>{contactInfo.operatingHours}</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Social Media and Copyright */}
        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-normal">
          <div>
            &copy; {new Date().getFullYear()} Forum UMKM KUAT Kecamatan Tangerang. Hak Cipta Dilindungi Undang-Undang.
          </div>

          {/* Social icons in bottom bar */}
          {(contactInfo.instagram || contactInfo.tiktok || contactInfo.youtube || contactInfo.facebook) && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium">Sosial Media:</span>
              <div className="flex items-center gap-1.5">
                {contactInfo.instagram && (
                  <a
                    href={formatSocialUrl(contactInfo.instagram, 'instagram')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-pink-400 hover:bg-slate-800 transition-colors"
                    title={`Instagram: ${contactInfo.instagram}`}
                    aria-label="Instagram"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                  </a>
                )}
                {contactInfo.tiktok && (
                  <a
                    href={formatSocialUrl(contactInfo.tiktok, 'tiktok')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title={`TikTok: ${contactInfo.tiktok}`}
                    aria-label="TikTok"
                  >
                    <TikTokIcon className="w-3.5 h-3.5" />
                  </a>
                )}
                {contactInfo.youtube && (
                  <a
                    href={formatSocialUrl(contactInfo.youtube, 'youtube')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    title={`YouTube: ${contactInfo.youtube}`}
                    aria-label="YouTube"
                  >
                    <Youtube className="w-3.5 h-3.5" />
                  </a>
                )}
                {contactInfo.facebook && (
                  <a
                    href={formatSocialUrl(contactInfo.facebook, 'facebook')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                    title={`Facebook: ${contactInfo.facebook}`}
                    aria-label="Facebook"
                  >
                    <Facebook className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Membangun UMKM Berdaya Saing &</span>
            <span className="text-amber-400 font-bold">KUAT</span>
            <span>Tangerang</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
