import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  Bell,
  ShieldCheck,
  Globe,
  User,
  Calendar as CalendarIcon,
} from 'lucide-react';

interface AdminNavbarProps {
  activeMenu: string;
  onOpenMobileSidebar: () => void;
  onExitToPublic: () => void;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({
  activeMenu,
  onOpenMobileSidebar,
  onExitToPublic,
}) => {
  const { profile } = useAuth();

  const titleMap: Record<string, string> = {
    dashboard: 'Dashboard Utama',
    keanggotaan: 'Manajemen Keanggotaan UMKM',
    keuangan: 'Buku Kas & Manajemen Keuangan',
    laporan: 'Laporan Eksekutif & Statistik',
    event_berita: 'Manajemen Event & Kabar Berita',
    pengaturan: 'Pengaturan Sistem, Hak Akses & Cadangan Data',
  };

  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between">
      {/* Left: Mobile trigger & breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          aria-label="Open Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Portal Admin UMKM</span>
            <span>/</span>
            <span className="font-semibold text-teal-700 capitalize">
              {activeMenu.replace('_', ' ')}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {titleMap[activeMenu] || 'Dashboard Admin'}
          </h1>
        </div>
      </div>

      {/* Right: Date, Role badge, & Public site button */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg">
          <CalendarIcon className="w-3.5 h-3.5 text-teal-600" />
          <span>{currentDate}</span>
        </div>

        {/* Role Badge */}
        <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span className="hidden sm:inline capitalize">
            {profile?.role.replace('_', ' ')}
          </span>
        </div>

        {/* View public portal */}
        <button
          onClick={onExitToPublic}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          title="Buka Website Publik"
        >
          <Globe className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden sm:inline">Web Publik</span>
        </button>
      </div>
    </header>
  );
};
