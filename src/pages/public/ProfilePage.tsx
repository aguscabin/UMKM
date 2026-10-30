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
    <div className="space-y-16 py-12">
      {/* Title Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Profil Resmi Organisasi</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Forum UMKM <span className="text-teal-600">KUAT</span> Kecamatan Tangerang
        </h1>
        <p className="max-w-3xl mx-auto text-slate-600 text-base sm:text-lg leading-relaxed">
          Wadah pemersatu dan pemberdayaan pelaku usaha mikro, kecil, dan menengah di jantung Kota Tangerang untuk mewujudkan ekonomi lokal yang mandiri, berdaya saing, dan berkesinambungan.
        </p>
      </section>

      {/* Brand & Meaning */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-800/80 rounded-2xl border border-slate-700 text-center">
            <UmkmKuatLogo size="xl" variant="icon" theme="light" />
            <h3 className="font-extrabold text-xl mt-4">Makna Nama & Logo KUAT</h3>
            <span className="text-xs text-teal-300 font-semibold tracking-wider uppercase mt-1">
              Kreatif &bull; Unggul &bull; Aktif &bull; Teladan
            </span>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Fondasi Semangat <span className="text-orange-400">KUAT</span>
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Nama <strong>KUAT</strong> merupakan semboyan tekad bersama seluruh pelaku usaha di Kecamatan Tangerang untuk berdaya saing tinggi dan berintegritas.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-center">
                <span className="text-2xl font-black text-orange-400">K</span>
                <div className="font-bold text-sm text-white">Kreatif</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Inovasi produk & kemasan</div>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-center">
                <span className="text-2xl font-black text-teal-400">U</span>
                <div className="font-bold text-sm text-white">Unggul</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Mutu & kualitas terbaik</div>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-center">
                <span className="text-2xl font-black text-orange-400">A</span>
                <div className="font-bold text-sm text-white">Aktif</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Berjejaring & ikut bazar</div>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-center">
                <span className="text-2xl font-black text-teal-400">T</span>
                <div className="font-bold text-sm text-white">Teladan</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Tertib legalitas & amanah</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visi & Misi */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Visi */}
          <div className="bg-gradient-to-br from-teal-900 to-teal-950 text-white rounded-3xl p-8 sm:p-10 shadow-lg border border-teal-800 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
                <Target className="w-6 h-6" />
              </div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-teal-300">
                Arah Tujuan
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold">Visi Organisasi</h3>
              <p className="text-base sm:text-lg text-slate-200 leading-relaxed italic">
                &ldquo;{visionMission.vision}&rdquo;
              </p>
            </div>
          </div>

          {/* Misi */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-md border border-slate-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-orange-600">
                Langkah Nyata
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Misi Organisasi</h3>
              <ul className="space-y-3 text-slate-700 text-sm sm:text-base">
                {visionMission.missions.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    <span>{m}</span>
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
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
            Kepengurusan
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Struktur Organisasi Forum UMKM KUAT
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Dipimpin oleh para penggiat UMKM berpengalaman berkolaborasi erat bersama Pemerintah Kecamatan Tangerang.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {structure.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-6 text-center shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-between hover:-translate-y-1 group"
            >
              <div className="flex flex-col items-center w-full">
                <div className="relative mb-4">
                  <img
                    src={member.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                    alt={member.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-teal-500/20 shadow-md group-hover:border-teal-500 transition-colors"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';
                    }}
                  />
                  <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gradient-to-r from-teal-700 to-teal-800 text-white font-black text-[10px] px-3 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
                    {member.role}
                  </span>
                </div>
                <h4 className="font-black text-slate-900 text-base sm:text-lg mt-2 leading-snug">{member.name}</h4>
                <p className="text-xs text-slate-500 mt-1 font-medium">{member.title}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8 KELURAHAN DETAIL */}
      <section className="bg-slate-50 py-16 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              Kewilayahan
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              8 Kelurahan Kecamatan Tangerang
            </h2>
            <p className="text-slate-600 text-sm">
              Forum UMKM KUAT hadir mengakar hingga tingkat RT/RW di delapan kelurahan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {KELURAHAN_LIST.map((kel, idx) => (
              <div
                key={kel}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-500 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400">0{idx + 1}</span>
                  <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-bold">
                    Kelurahan
                  </span>
                </div>
                <h4 className="font-bold text-lg text-slate-900">Kel. {kel}</h4>
                <p className="text-xs text-slate-500">
                  Pusat sentra usaha lokal, kuliner khas, dan kerajinan tangan warga binaan.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
