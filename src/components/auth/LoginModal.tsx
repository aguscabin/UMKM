import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UmkmKuatLogo } from '../UmkmKuatLogo';
import { UserRole } from '../../types';
import {
  X,
  ShieldCheck,
  Lock,
  LogIn,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  UserCheck,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { loginWithGoogle, quickAdminLogin, loading } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedDemoRole, setSelectedDemoRole] = useState<UserRole>('super_admin');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    try {
      await loginWithGoogle();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Gagal masuk dengan Google. Anda dapat mencoba mode demo pengurus di bawah.');
    }
  };

  const handleDemoLogin = (role: UserRole) => {
    quickAdminLogin(role);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center text-center space-y-2">
            <UmkmKuatLogo size="lg" variant="icon" theme="light" />
            <h3 className="text-xl font-black tracking-tight text-white mt-1">
              Portal Admin & Pengurus
            </h3>
            <p className="text-xs text-slate-400">
              Forum UMKM KUAT Kecamatan Tangerang
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Primary Option: Google Authentication */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              1. Masuk Menggunakan Akun Google
            </span>
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm py-3 px-4 rounded-xl border border-slate-300 shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {/* Google SVG Icon */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Memproses...' : 'Masuk dengan Google'}</span>
            </button>
            <p className="text-[11px] text-slate-500 text-center">
              Akses otomatis diatur sesuai email pengurus yang terdaftar di database.
            </p>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-3 text-slate-400 text-xs uppercase font-semibold">
              atau pilih peran pengurus
            </span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          {/* Secondary Option: Role-Based Quick Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Uji Coba Cepat Hak Akses (RBAC)
              </span>
              <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-bold">
                6 Peran
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleDemoLogin('super_admin')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-left transition-all group cursor-pointer"
              >
                <div className="font-bold text-slate-900 group-hover:text-teal-700">
                  Super Admin
                </div>
                <div className="text-[10px] text-slate-500">Akses Penuh Semua Modul</div>
              </button>

              <button
                onClick={() => handleDemoLogin('bendahara')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-left transition-all group cursor-pointer"
              >
                <div className="font-bold text-slate-900 group-hover:text-teal-700">
                  Bendahara
                </div>
                <div className="text-[10px] text-slate-500">Kelola Kas & Iuran</div>
              </button>

              <button
                onClick={() => handleDemoLogin('admin_keanggotaan')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-left transition-all group cursor-pointer"
              >
                <div className="font-bold text-slate-900 group-hover:text-teal-700">
                  Admin Keanggotaan
                </div>
                <div className="text-[10px] text-slate-500">Kelola Data UMKM</div>
              </button>

              <button
                onClick={() => handleDemoLogin('admin_informasi')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-left transition-all group cursor-pointer"
              >
                <div className="font-bold text-slate-900 group-hover:text-teal-700">
                  Admin Informasi
                </div>
                <div className="text-[10px] text-slate-500">Event & Kabar Berita</div>
              </button>

              <button
                onClick={() => handleDemoLogin('pengurus_kecamatan')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-left transition-all group cursor-pointer"
              >
                <div className="font-bold text-slate-900 group-hover:text-teal-700">
                  Pengurus Kecamatan
                </div>
                <div className="text-[10px] text-slate-500">Laporan & Eksekutif</div>
              </button>

              <button
                onClick={() => handleDemoLogin('pengurus_kelurahan')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-left transition-all group cursor-pointer"
              >
                <div className="font-bold text-slate-900 group-hover:text-teal-700">
                  Pengurus Kelurahan
                </div>
                <div className="text-[10px] text-slate-500">Input UMKM Wilayah</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Keamanan Terproteksi Firebase Authentication</span>
        </div>
      </div>
    </div>
  );
};
