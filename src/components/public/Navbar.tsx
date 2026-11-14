import React, { useState, useEffect } from 'react';
import { UmkmKuatLogo } from '../UmkmKuatLogo';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  X,
  ShieldCheck,
  Phone,
  LayoutDashboard,
  LogIn,
  Store,
  Calendar,
  Newspaper,
  Info,
  HelpCircle,
  Instagram,
  Youtube,
  Facebook,
} from 'lucide-react';
import { TikTokIcon, formatSocialUrl } from '../common/SocialIcons';
import { dbService, INITIAL_CONTACT_INFO } from '../../services/db';
import { OrgContactInfo } from '../../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openLoginModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  openLoginModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactInfo, setContactInfo] = useState<OrgContactInfo>(INITIAL_CONTACT_INFO);
  const { profile, isAdmin } = useAuth();

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

    const unsubscribe = dbService.subscribeContactInfo((data) => {
      if (data) setContactInfo(data);
    });

    const handleUpdate = (e: any) => {
      if (e.detail) setContactInfo(e.detail);
    };
    window.addEventListener('umkm_contact_info_updated', handleUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('umkm_contact_info_updated', handleUpdate);
    };
  }, []);

  const navLinks = [
    { id: 'beranda', label: 'Beranda' },
    { id: 'profil', label: 'Profil Organisasi' },
    { id: 'direktori', label: 'Direktori UMKM' },
    { id: 'event', label: 'Event & Kegiatan' },
    { id: 'berita', label: 'Kabar Berita' },
    { id: 'kontak', label: 'Kontak' },
  ];

  const handleNavClick = (tabId: string) => {
    setCurrentTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-stone-200">
      {/* Top Civic Strip */}
      <div className="bg-[#121918] text-stone-300 px-4 py-2 text-xs border-b border-stone-800 font-normal">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="text-stone-200 tracking-tight font-medium">
              Portal Resmi Forum UMKM KUAT &mdash; Kecamatan Tangerang, Kota Tangerang
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-stone-400">
            <a
              href="https://wa.me/6282258570582?text=Halo%20Admin%20Forum%20UMKM%20KUAT%20Kecamatan%20Tangerang"
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-1.5 hover:text-white transition-all duration-150 active:scale-[0.98]"
            >
              <Phone className="w-3 h-3 text-teal-400 group-hover:-rotate-12 transition-transform duration-150" />
              <span>Hotline WhatsApp: <strong className="text-stone-100 font-semibold tabular-nums">+62 82258570582</strong></span>
            </a>
            <span className="text-stone-700 hidden sm:inline" aria-hidden="true">/</span>
            <span className="text-amber-400 font-semibold hidden sm:inline">8 Kelurahan Binaan</span>

            {/* Top Bar Social Media Icons (Desktop) */}
            {(contactInfo.instagram || contactInfo.tiktok || contactInfo.youtube || contactInfo.facebook) && (
              <div className="hidden lg:flex items-center gap-2.5 pl-3 border-l border-stone-800">
                {contactInfo.instagram && (
                  <a
                    href={formatSocialUrl(contactInfo.instagram, 'instagram')}
                    target="_blank"
                    rel="noreferrer"
                    className="text-stone-400 hover:text-white hover:-translate-y-0.5 active:scale-90 transition-all duration-150"
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
                    rel="noreferrer"
                    className="text-stone-400 hover:text-white hover:-translate-y-0.5 active:scale-90 transition-all duration-150"
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
                    rel="noreferrer"
                    className="text-stone-400 hover:text-white hover:-translate-y-0.5 active:scale-90 transition-all duration-150"
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
                    rel="noreferrer"
                    className="text-stone-400 hover:text-white hover:-translate-y-0.5 active:scale-90 transition-all duration-150"
                    title={`Facebook: ${contactInfo.facebook}`}
                    aria-label="Facebook"
                  >
                    <Facebook className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-18 sm:h-20">
          {/* Logo */}
          <button
            onClick={() => handleNavClick('beranda')}
            className="flex items-center text-left focus:outline-hidden transition-transform duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] hover:opacity-90 active:scale-[0.98] shrink-0 cursor-pointer"
          >
            <UmkmKuatLogo size="md" variant="full" theme="dark" />
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`group relative px-3.5 py-2 rounded-lg text-sm whitespace-nowrap shrink-0 btn-micro cursor-pointer ${
                    isActive
                      ? 'text-teal-800 bg-teal-50 border border-teal-200 font-bold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/80 border border-transparent font-medium'
                  }`}
                >
                  <span>{link.label}</span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute left-3 right-3 bottom-1 h-0.5 rounded-full bg-teal-700 origin-center transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isActive
                        ? 'scale-x-100'
                        : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* Action / Admin Button */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {isAdmin && profile ? (
              <button
                onClick={() => setCurrentTab('admin')}
                className="group btn-micro flex items-center gap-2 bg-[#121918] hover:bg-stone-800 text-white px-4 py-2.5 rounded-xl font-semibold text-sm cursor-pointer border border-stone-800 hover:border-stone-700 whitespace-nowrap shrink-0"
              >
                <LayoutDashboard className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                <span>Dashboard Admin</span>
                <span className="text-[10px] bg-stone-800 text-teal-300 font-mono px-1.5 py-0.5 rounded border border-stone-700 uppercase">
                  {profile.role.replace('_', ' ')}
                </span>
              </button>
            ) : (
              <button
                onClick={openLoginModal}
                className="group btn-micro flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-4 py-2.5 rounded-xl font-semibold text-sm cursor-pointer border border-teal-800 whitespace-nowrap shrink-0"
              >
                <ShieldCheck className="w-4 h-4 text-amber-300 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                <span>Masuk Admin</span>
              </button>
            )}
          </div>

          {/* Mobile & Tablet Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => handleNavClick('admin')}
                className="btn-micro p-2.5 text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                title="Dashboard Admin"
              >
                <LayoutDashboard className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn-micro p-2 text-stone-700 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 rounded-lg focus:outline-hidden min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
              aria-label="Toggle Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 transition-transform duration-200 rotate-90" />
              ) : (
                <Menu className="w-5 h-5 transition-transform duration-200" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6">
          <div className="flex flex-col gap-1.5 mb-4">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`btn-micro w-full text-left px-4 py-2.5 rounded-lg text-sm min-h-[44px] flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'text-teal-800 bg-teal-50 border border-teal-200 font-bold'
                      : 'text-stone-700 hover:bg-stone-100 border border-transparent font-medium'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-700" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-stone-200 flex flex-col gap-2">
            {isAdmin ? (
              <button
                onClick={() => handleNavClick('admin')}
                className="btn-micro w-full flex items-center justify-center gap-2 bg-[#121918] hover:bg-stone-800 text-white py-3 rounded-xl font-semibold text-sm border border-stone-800 min-h-[44px] cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4 text-teal-400" />
                <span>Buka Dashboard Admin</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openLoginModal();
                }}
                className="btn-micro w-full flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-xl font-semibold text-sm border border-teal-800 min-h-[44px] cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Portal Admin</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
