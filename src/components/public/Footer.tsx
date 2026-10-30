import React, { useState, useEffect } from 'react';
import { UmkmKuatLogo } from '../UmkmKuatLogo';
import { KELURAHAN_LIST, OrgContactInfo } from '../../types';
import { dbService, INITIAL_CONTACT_INFO } from '../../services/db';
import { MapPin, Phone, Mail, Clock, ShieldCheck, ExternalLink, Heart } from 'lucide-react';

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
  }, []);

  return (
    <footer className="bg-slate-950 text-slate-300 pt-20 pb-12 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-14">
          {/* Col 1: Brand & About */}
          <div className="space-y-4">
            <UmkmKuatLogo size="lg" variant="full" theme="light" />
            <p className="text-sm text-slate-400 leading-relaxed font-normal">
              Wadah kolaborasi, pembinaan, legalitas usaha, dan pemasaran produk Usaha Mikro, Kecil, dan Menengah binaan Kecamatan Tangerang, Kota Tangerang.
            </p>
            <div className="inline-flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-teal-300">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Mitra Resmi Kecamatan Tangerang</span>
            </div>
          </div>

          {/* Col 2: 8 Kelurahan Binaan */}
          <div>
            <h4 className="text-white font-black text-xs tracking-widest uppercase mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
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
                  className="text-left text-slate-400 hover:text-teal-300 transition-colors py-1 flex items-center gap-1.5 group cursor-pointer"
                >
                  <span className="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-teal-400 transition-colors"></span>
                  <span>{kel}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-4 leading-relaxed font-normal">
              Menjangkau seluruh pelaku usaha mikro & kecil se-Kecamatan Tangerang.
            </p>
          </div>

          {/* Col 3: Navigasi Cepat */}
          <div>
            <h4 className="text-white font-black text-xs tracking-widest uppercase mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
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

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-normal">
          <div>
            &copy; {new Date().getFullYear()} Forum UMKM KUAT Kecamatan Tangerang. Hak Cipta Dilindungi Undang-Undang.
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Membangun UMKM Berdaya Saing &</span>
            <span className="text-amber-400 font-bold">KUAT</span>
            <span>untuk Tangerang Gemilang</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
