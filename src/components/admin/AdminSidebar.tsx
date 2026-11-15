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
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface AdminSidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  onExitToPublic: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeMenu,
  setActiveMenu,
  onExitToPublic,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const {
    profile,
    logout,
    simulateRole,
    isSuperAdmin,
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
    <aside
      className={`${
        isCollapsed ? 'w-[76px]' : 'w-64'
      } bg-[#121918] text-stone-300 flex flex-col justify-between border-r border-stone-800 select-none h-screen sticky top-0 z-30 transition-[width] duration-200 ease-out print:hidden`}
    >
      {/* Brand & Logo Header */}
      <div>
        <div
          className={`border-b border-stone-800 ${
            isCollapsed ? 'px-2.5 py-3.5 flex flex-col items-center gap-2.5' : 'px-4 py-4 flex items-center justify-between gap-2'
          }`}
        >
          <UmkmKuatLogo
            size={isCollapsed ? 'sm' : 'md'}
            variant={isCollapsed ? 'icon' : 'full'}
            theme="light"
          />

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Perluas Sidebar' : 'Perkecil Sidebar'}
              aria-label={isCollapsed ? 'Perluas Sidebar' : 'Perkecil Sidebar'}
              className="btn-micro min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 border border-transparent hover:border-stone-700 transition-colors cursor-pointer flex-shrink-0"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-teal-400" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Current User & Active Role Switcher */}
        <div
          className={`bg-stone-950/60 border-b border-stone-800 ${
            isCollapsed ? 'px-2 py-3 flex justify-center' : 'p-4'
          }`}
        >
          {isCollapsed ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              title={`${profile?.displayName || 'Pengurus Forum'} (${
                roleLabels[profile?.role || 'member']
              }) — Klik untuk memperluas`}
              className="group relative h-10 w-10 rounded-xl bg-teal-700 border border-teal-600 flex items-center justify-center text-white font-extrabold text-sm cursor-pointer hover:bg-teal-600 transition-colors"
            >
              <span>{profile?.displayName?.charAt(0) || 'A'}</span>
              <span className="pointer-events-none hidden group-hover:flex items-center gap-1.5 absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-[#121918] text-white border border-stone-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap z-50">
                <span>{profile?.displayName || 'Pengurus Forum'}</span>
              </span>
            </button>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-teal-700 border border-teal-600 flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0">
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

              {/* Quick Role Simulation Selector - Only accessible for Super Admin */}
              {isSuperAdmin && (
                <div className="mt-3 pt-2.5 border-t border-stone-800">
                  <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1">
                    <span className="font-semibold uppercase tracking-wider">Peran Aktif (RBAC):</span>
                  </div>
                  <select
                    value={profile?.role || 'super_admin'}
                    onChange={(e) => simulateRole(e.target.value as UserRole)}
                    className="w-full bg-stone-900 border border-stone-700 text-teal-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-500 font-semibold cursor-pointer"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="pengurus_kecamatan">Pengurus Kecamatan</option>
                    <option value="admin_keanggotaan">Admin Keanggotaan</option>
                    <option value="bendahara">Bendahara</option>
                    <option value="admin_informasi">Admin Informasi</option>
                    <option value="pengurus_kelurahan">Pengurus Kelurahan</option>
                  </select>
                </div>
              )}
            </>
          )}
        </div>

        {/* Navigation Menus */}
        <nav className={`${isCollapsed ? 'p-2.5 space-y-1.5' : 'p-3 space-y-1'}`}>
          {!isCollapsed && (
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Menu Manajemen
            </div>
          )}
          {menuItems.map((item) => {
            if (!item.allowed) return null;
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveMenu(item.id)}
                title={isCollapsed ? item.label : undefined}
                aria-label={item.label}
                className={`group relative btn-micro w-full flex items-center min-h-[42px] rounded-xl text-xs sm:text-sm font-semibold cursor-pointer ${
                  isCollapsed ? 'justify-center px-0 py-2.5' : 'justify-between px-3.5 py-2.5'
                } ${
                  isActive
                    ? 'bg-teal-700 text-white'
                    : 'text-stone-400 hover:text-white hover:bg-stone-800/80'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-stone-400 group-hover:text-teal-400'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold transition-colors flex-shrink-0 ${
                      isActive
                        ? 'bg-teal-800 text-teal-100'
                        : 'bg-stone-800 text-teal-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {isCollapsed && (
                  <span className="pointer-events-none hidden group-hover:flex items-center gap-2 absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-[#121918] text-white border border-stone-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap z-50">
                    <span>{item.label}</span>
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Bottom Controls */}
      <div className={`${isCollapsed ? 'p-2.5' : 'p-3'} border-t border-stone-800 space-y-2`}>
        <button
          type="button"
          onClick={onExitToPublic}
          title={isCollapsed ? 'Lihat Website Publik' : undefined}
          aria-label="Lihat Website Publik"
          className={`group relative btn-micro w-full flex items-center min-h-[42px] rounded-xl text-xs font-semibold text-stone-300 hover:text-white hover:bg-stone-800 cursor-pointer ${
            isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-3.5 py-2.5'
          }`}
        >
          <Globe className="w-4 h-4 text-teal-400 flex-shrink-0 group-hover:rotate-12 transition-transform duration-200" />
          {!isCollapsed && <span className="truncate">Lihat Website Publik</span>}
          {isCollapsed && (
            <span className="pointer-events-none hidden group-hover:flex items-center absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-[#121918] text-white border border-stone-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap z-50">
              Lihat Website Publik
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            logout();
            onExitToPublic();
          }}
          title={isCollapsed ? 'Keluar dari Akun' : undefined}
          aria-label="Keluar dari Akun"
          className={`group relative btn-micro w-full flex items-center min-h-[42px] rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer ${
            isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-3.5 py-2.5'
          }`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0 group-hover:-translate-x-0.5 transition-transform duration-200" />
          {!isCollapsed && <span className="truncate">Keluar dari Akun</span>}
          {isCollapsed && (
            <span className="pointer-events-none hidden group-hover:flex items-center absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-[#121918] text-red-300 border border-stone-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap z-50">
              Keluar dari Akun
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};
