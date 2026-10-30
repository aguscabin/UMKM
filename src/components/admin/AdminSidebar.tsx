import React from 'react';
import { UmkmKuatLogo } from '../UmkmKuatLogo';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  LayoutDashboard,
  Users,
  Wallet,
  FileText,
  Calendar,
  Settings,
  Globe,
  LogOut,
  Shield,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface AdminSidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  onExitToPublic: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeMenu,
  setActiveMenu,
  onExitToPublic,
}) => {
  const {
    profile,
    logout,
    simulateRole,
    canManageMembers,
    canManageFinances,
    canManageEventsNews,
    canManageSettings,
    canViewReports,
  } = useAuth();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      allowed: true,
      badge: null,
    },
    {
      id: 'keanggotaan',
      label: 'Keanggotaan',
      icon: Users,
      allowed: canManageMembers,
      badge: 'UMKM',
    },
    {
      id: 'keuangan',
      label: 'Keuangan',
      icon: Wallet,
      allowed: canManageFinances,
      badge: 'Kas',
    },
    {
      id: 'laporan',
      label: 'Laporan',
      icon: FileText,
      allowed: canViewReports,
      badge: null,
    },
    {
      id: 'event_berita',
      label: 'Event & Berita',
      icon: Calendar,
      allowed: canManageEventsNews,
      badge: null,
    },
    {
      id: 'pengaturan',
      label: 'Pengaturan & Akses',
      icon: Settings,
      allowed: canManageSettings,
      badge: 'RBAC',
    },
  ];

  const roleLabels: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    pengurus_kecamatan: 'Pengurus Kecamatan',
    admin_keanggotaan: 'Admin Keanggotaan',
    bendahara: 'Bendahara',
    admin_informasi: 'Admin Informasi',
    pengurus_kelurahan: 'Pengurus Kelurahan',
    member: 'Member / Pendaftar',
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 select-none h-screen sticky top-0">
      {/* Brand & Logo Header */}
      <div>
        <div className="p-5 border-b border-slate-800">
          <UmkmKuatLogo size="md" variant="full" theme="light" />
        </div>

        {/* Current User & Active Role Switcher */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-black text-sm shadow-sm">
              {profile?.displayName?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">
                {profile?.displayName || 'Pengurus Forum'}
              </div>
              <div className="text-[10px] text-teal-400 font-medium truncate">
                {profile?.email}
              </div>
            </div>
          </div>

          {/* Quick Role Simulation Selector */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider">Peran Aktif (RBAC):</span>
            </div>
            <select
              value={profile?.role || 'super_admin'}
              onChange={(e) => simulateRole(e.target.value as UserRole)}
              className="w-full bg-slate-800 border border-slate-700 text-teal-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-teal-500 font-semibold cursor-pointer"
            >
              <option value="super_admin">Super Admin</option>
              <option value="pengurus_kecamatan">Pengurus Kecamatan</option>
              <option value="admin_keanggotaan">Admin Keanggotaan</option>
              <option value="bendahara">Bendahara</option>
              <option value="admin_informasi">Admin Informasi</option>
              <option value="pengurus_kelurahan">Pengurus Kelurahan</option>
            </select>
          </div>
        </div>

        {/* Navigation Menus */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Menu Manajemen
          </div>
          {menuItems.map((item) => {
            if (!item.allowed) return null;
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-800 text-teal-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Bottom Controls */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        <button
          onClick={onExitToPublic}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Globe className="w-4 h-4 text-teal-400" />
          <span>Lihat Website Publik</span>
        </button>

        <button
          onClick={() => {
            logout();
            onExitToPublic();
          }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar dari Akun</span>
        </button>
      </div>
    </aside>
  );
};
