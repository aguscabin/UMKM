import React, { useState } from 'react';
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
} from 'lucide-react';

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
  const { profile } = useAuth();

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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Civic Banner */}
      <div className="bg-slate-950 text-slate-300 px-4 py-2 text-xs border-b border-slate-800/80 font-normal">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400"></span>
            </span>
            <span className="text-slate-300 tracking-tight font-medium">
              Portal Resmi Forum UMKM KUAT &mdash; Kecamatan Tangerang, Kota Tangerang
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <a
              href="https://wa.me/6285880942565?text=Halo%20Admin%20Forum%20UMKM%20KUAT%20Kecamatan%20Tangerang"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition-colors group"
            >
              <Phone className="w-3 h-3 text-teal-400 group-hover:scale-110 transition-transform" />
              <span>Hotline WhatsApp: <strong className="text-slate-200 font-semibold">085880942565</strong></span>
            </a>
            <span className="text-slate-700 hidden sm:inline">&bull;</span>
            <span className="text-amber-400 font-semibold hidden sm:inline">8 Kelurahan Binaan</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <button
            onClick={() => handleNavClick('beranda')}
            className="flex items-center text-left focus:outline-hidden group transition-opacity hover:opacity-95"
          >
            <UmkmKuatLogo size="md" variant="full" theme="dark" />
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'text-teal-900 bg-teal-50 border border-teal-200/70 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Action / Admin Button */}
          <div className="hidden lg:flex items-center gap-3">
            {profile ? (
              <button
                onClick={() => setCurrentTab('admin')}
                className="flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all duration-200 cursor-pointer border border-slate-800 hover:border-slate-700 hover:shadow-md"
              >
                <LayoutDashboard className="w-4 h-4 text-teal-400" />
                <span>Dashboard Admin</span>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 font-mono px-1.5 py-0.5 rounded border border-teal-500/30 uppercase">
                  {profile.role.replace('_', ' ')}
                </span>
              </button>
            ) : (
              <button
                onClick={openLoginModal}
                className="flex items-center gap-2 bg-gradient-to-r from-teal-700 via-teal-600 to-teal-700 hover:from-teal-800 hover:to-teal-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-teal-600/30"
              >
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>Masuk Admin</span>
              </button>
            )}
          </div>

          {/* Mobile & Tablet Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            {profile && (
              <button
                onClick={() => handleNavClick('admin')}
                className="p-2 text-teal-700 bg-teal-50 rounded-lg"
                title="Dashboard Admin"
              >
                <LayoutDashboard className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus:outline-hidden"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 shadow-xl animate-in fade-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-1.5 mb-4">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? 'text-teal-700 bg-teal-50 font-bold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {profile ? (
              <button
                onClick={() => handleNavClick('admin')}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-xl font-semibold text-sm shadow-sm"
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
                className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm shadow-sm"
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
