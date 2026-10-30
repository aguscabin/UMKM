import React, { useState, useEffect } from 'react';
import { KELURAHAN_LIST, OrgStructureMember, OrgVisionMission } from '../../types';
import { dbService, INITIAL_ORG_STRUCTURE, INITIAL_VISION_MISSION } from '../../services/db';
import {
  ShieldCheck,
  Target,
  Compass,
  Award,
  Users2,
  Building,
  CheckCircle,
  Sparkles,
  MapPin,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { UmkmKuatLogo } from '../../components/UmkmKuatLogo';

export const ProfilePage: React.FC = () => {
  const [structure, setStructure] = useState<OrgStructureMember[]>(() => dbService.getCachedOrgStructure());
  const [visionMission, setVisionMission] = useState<OrgVisionMission>(() => dbService.getCachedVisionMission());

  useEffect(() => {
    let isMounted = true;
    dbService.getOrgStructure().then((res) => {
      if (isMounted && res && res.length > 0) {
        setStructure(res);
      }
    });

    dbService.getVisionMission().then((res) => {
      if (isMounted && res && res.vision) {
        setVisionMission(res);
      }
    });

    // Real-time synchronization when edited in Admin Settings
    const handleOrgUpdate = (e: any) => {
      if (isMounted && e.detail) {
        setStructure(e.detail);
      }
    };
    window.addEventListener('umkm_org_structure_updated', handleOrgUpdate);
    const handleStorageUpdate = () => {
      if (isMounted) {
        setStructure(dbService.getCachedOrgStructure());
        setVisionMission(dbService.getCachedVisionMission());
      }
    };
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('umkm_org_structure_updated', handleOrgUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  return (
    <div className="space-y-20 py-16">
      {/* Title Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-widest text-teal-700">
          Profil Resmi Organisasi
        </span>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight">
          Forum UMKM <span className="text-teal-700">KUAT</span> Kecamatan Tangerang
        </h1>
        <p className="max-w-3xl mx-auto text-slate-600 text-base sm:text-lg leading-relaxed">
          Wadah pemersatu dan pemberdayaan pelaku usaha mikro, kecil, dan menengah di jantung Kota Tangerang untuk mewujudkan ekonomi lokal yang mandiri, berdaya saing, dan berkesinambungan.
        </p>
      </section>

      {/* Brand & Meaning */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-950 text-white rounded-3xl p-8 sm:p-14 shadow-2xl border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-8 bg-slate-900/90 rounded-2xl border border-slate-800 text-center relative z-10 shadow-lg">
            <UmkmKuatLogo size="xl" variant="icon" theme="light" />
            <h3 className="font-black text-xl mt-5 tracking-tight">Makna Nama & Logo KUAT</h3>
            <span className="text-xs text-teal-300 font-semibold tracking-wider uppercase mt-1">
              Kreatif &bull; Unggul &bull; Aktif &bull; Teladan
            </span>
          </div>

          <div className="lg:col-span-8 space-y-5 relative z-10">
            <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
              Nilai Luhur Organisasi
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Fondasi Semangat <span className="text-amber-400">KUAT</span>
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Nama <strong>KUAT</strong> merupakan semboyan tekad bersama seluruh pelaku usaha di Kecamatan Tangerang untuk berdaya saing tinggi, tertib legalitas, dan berintegritas.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-center hover:border-amber-500/40 transition-colors">
                <span className="text-3xl font-black text-amber-400">K</span>
                <div className="font-bold text-sm text-white mt-1">Kreatif</div>
                <div className="text-[11px] text-slate-400 mt-1">Inovasi produk & kemasan</div>
              </div>
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-center hover:border-teal-500/40 transition-colors">
                <span className="text-3xl font-black text-teal-400">U</span>
                <div className="font-bold text-sm text-white mt-1">Unggul</div>
                <div className="text-[11px] text-slate-400 mt-1">Mutu & kualitas terbaik</div>
              </div>
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-center hover:border-amber-500/40 transition-colors">
                <span className="text-3xl font-black text-amber-400">A</span>
                <div className="font-bold text-sm text-white mt-1">Aktif</div>
                <div className="text-[11px] text-slate-400 mt-1">Berjejaring & bazar</div>
              </div>
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-center hover:border-teal-500/40 transition-colors">
                <span className="text-3xl font-black text-teal-400">T</span>
                <div className="font-bold text-sm text-white mt-1">Teladan</div>
                <div className="text-[11px] text-slate-400 mt-1">Tertib legalitas usaha</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visi & Misi */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">
          {/* Visi */}
          <div className="bg-slate-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-800 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-4 relative z-10">
              <div className="h-12 w-12 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300">
                <Target className="w-6 h-6" />
              </div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-teal-400">
                Arah Tujuan Jangka Panjang
              </span>
              <h3 className="text-2xl sm:text-3xl font-black">Visi Organisasi</h3>
              <blockquote className="text-base sm:text-lg text-slate-200 leading-relaxed italic border-l-2 border-teal-500 pl-4 py-1">
                &ldquo;{visionMission.vision}&rdquo;
              </blockquote>
            </div>
          </div>

          {/* Misi */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-900/5 border border-slate-200/90 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-amber-700">
                Langkah Strategis Nyata
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">Misi Organisasi</h3>
              <ul className="space-y-3.5 text-slate-700 text-sm sm:text-base">
                {visionMission.missions.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* STRUKTUR ORGANISASI */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-700">
            Kepengurusan
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Struktur Organisasi Forum UMKM KUAT
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Dipimpin oleh para penggiat UMKM berpengalaman berkolaborasi erat bersama Pemerintah Kecamatan Tangerang.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {structure.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-7 text-center shadow-2xs hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col items-center justify-between hover:-translate-y-1 group"
            >
              <div className="flex flex-col items-center w-full">
                <div className="relative mb-5">
                  <img
                    src={member.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                    alt={member.name}
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-slate-100 group-hover:border-teal-500/40 transition-colors shadow-md"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';
                    }}
                  />
                  <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950 text-teal-300 border border-slate-800 font-bold text-[10px] px-3 py-1 rounded-md shadow-xs uppercase tracking-wider">
                    {member.role}
                  </span>
                </div>
                <h4 className="font-black text-slate-900 text-lg sm:text-xl mt-3 leading-snug">{member.name}</h4>
                <p className="text-xs text-slate-500 mt-1 font-medium">{member.title}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8 KELURAHAN DETAIL */}
      <section className="bg-slate-100/60 py-18 md:py-24 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
              Kewilayahan
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              8 Kelurahan Kecamatan Tangerang
            </h2>
            <p className="text-slate-600 text-sm">
              Forum UMKM KUAT hadir mengakar hingga tingkat RT/RW di delapan kelurahan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {KELURAHAN_LIST.map((kel, idx) => (
              <div
                key={kel}
                className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-teal-500 hover:shadow-md transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400">0{idx + 1}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold uppercase">
                    Kelurahan
                  </span>
                </div>
                <h4 className="font-bold text-lg text-slate-900">Kel. {kel}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Sentra pelaku usaha lokal, kuliner khas, dan kerajinan tangan warga binaan.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
