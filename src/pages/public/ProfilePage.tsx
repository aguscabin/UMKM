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
  MapPin,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { DEFAULT_MEMBER_PHOTO_PLACEHOLDER } from '../../utils/excelImport';
import { UmkmKuatLogo } from '../../components/UmkmKuatLogo';
import {
  ProfileStructureSkeleton,
  ShimmerImage,
} from '../../components/common/Skeleton';

export const ProfilePage: React.FC = () => {
  const [structure, setStructure] = useState<OrgStructureMember[]>(() => dbService.getCachedOrgStructure());
  const [visionMission, setVisionMission] = useState<OrgVisionMission>(() => dbService.getCachedVisionMission());
  const [loadingStructure, setLoadingStructure] = useState(() => dbService.getCachedOrgStructure().length === 0);

  useEffect(() => {
    let isMounted = true;
    dbService.getOrgStructure()
      .then((res) => {
        if (isMounted && res && res.length > 0) {
          setStructure(res);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingStructure(false);
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
    <div className="space-y-16 sm:space-y-20 py-14 sm:py-16">
      {/* Title Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-widest text-teal-700">
          Profil Resmi Organisasi
        </span>
        <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black text-stone-900 tracking-tight">
          Forum UMKM <span className="text-teal-700">KUAT</span> Kecamatan Tangerang
        </h1>
        <p className="max-w-3xl mx-auto text-stone-600 text-base sm:text-lg leading-relaxed">
          Wadah pemersatu dan pemberdayaan pelaku usaha mikro, kecil, dan menengah di jantung Kota Tangerang untuk mewujudkan ekonomi lokal yang mandiri, berdaya saing, dan berkesinambungan.
        </p>
      </section>

      {/* Brand & Meaning */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#121918] text-white rounded-2xl p-8 sm:p-12 border border-stone-800 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-8 bg-stone-900 rounded-xl border border-stone-800 text-center">
            <UmkmKuatLogo size="xl" variant="icon" theme="light" />
            <h3 className="font-black text-xl mt-5 tracking-tight text-white">Makna Nama &amp; Logo KUAT</h3>
            <span className="text-xs text-teal-300 font-semibold tracking-wider uppercase mt-1">
              Kreatif &bull; Unggul &bull; Aktif &bull; Teladan
            </span>
          </div>

          <div className="lg:col-span-8 space-y-5">
            <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
              Nilai Luhur Organisasi
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Fondasi Semangat <span className="text-amber-400">KUAT</span>
            </h2>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
              Nama <strong>KUAT</strong> merupakan semboyan tekad bersama seluruh pelaku usaha di Kecamatan Tangerang untuk berdaya saing tinggi, tertib legalitas, dan berintegritas.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
              <div className="bg-stone-900 p-4 rounded-xl border border-stone-800 text-center">
                <span className="text-3xl font-black text-amber-400">K</span>
                <div className="font-bold text-sm text-white mt-1">Kreatif</div>
                <div className="text-[11px] text-stone-400 mt-1">Inovasi produk &amp; kemasan</div>
              </div>
              <div className="bg-stone-900 p-4 rounded-xl border border-stone-800 text-center">
                <span className="text-3xl font-black text-teal-400">U</span>
                <div className="font-bold text-sm text-white mt-1">Unggul</div>
                <div className="text-[11px] text-stone-400 mt-1">Mutu &amp; kualitas terbaik</div>
              </div>
              <div className="bg-stone-900 p-4 rounded-xl border border-stone-800 text-center">
                <span className="text-3xl font-black text-amber-400">A</span>
                <div className="font-bold text-sm text-white mt-1">Aktif</div>
                <div className="text-[11px] text-stone-400 mt-1">Berjejaring &amp; bazar</div>
              </div>
              <div className="bg-stone-900 p-4 rounded-xl border border-stone-800 text-center">
                <span className="text-3xl font-black text-teal-400">T</span>
                <div className="font-bold text-sm text-white mt-1">Teladan</div>
                <div className="text-[11px] text-stone-400 mt-1">Tertib legalitas usaha</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visi & Misi */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Visi */}
          <div className="bg-[#121918] text-white rounded-2xl p-8 sm:p-10 border border-stone-800 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-11 w-11 rounded-xl bg-stone-900 border border-stone-700 flex items-center justify-center text-teal-300">
                <Target className="w-5 h-5" />
              </div>
              <span className="text-xs uppercase font-bold tracking-widest text-teal-400 block">
                Arah Tujuan Jangka Panjang
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">Visi Organisasi</h3>
              <blockquote className="text-base sm:text-lg text-stone-200 leading-relaxed bg-stone-900 border border-stone-800 rounded-xl p-5">
                &ldquo;{visionMission.vision}&rdquo;
              </blockquote>
            </div>
          </div>

          {/* Misi */}
          <div className="bg-white rounded-2xl p-8 sm:p-10 border border-stone-200 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="h-11 w-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-xs uppercase font-bold tracking-widest text-amber-700 block">
                Langkah Strategis Nyata
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-stone-900">Misi Organisasi</h3>
              <ul className="space-y-3.5 text-stone-700 text-sm sm:text-base">
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
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10 sm:mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-700">
            Kepengurusan
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
            Struktur Organisasi Forum UMKM KUAT
          </h2>
          <p className="text-stone-600 text-sm sm:text-base">
            Dipimpin oleh para penggiat UMKM berpengalaman berkolaborasi erat bersama Pemerintah Kecamatan Tangerang.
          </p>
        </div>

        {loadingStructure && structure.length === 0 ? (
          <ProfileStructureSkeleton count={3} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {structure.map((member) => (
              <div
                key={member.id}
                className="card-hover-interactive bg-white rounded-2xl border border-stone-200 p-7 text-center flex flex-col items-center justify-between group"
              >
                <div className="flex flex-col items-center w-full">
                  <div className="relative mb-5">
                    <ShimmerImage
                      src={member.image || DEFAULT_MEMBER_PHOTO_PLACEHOLDER}
                      fallbackSrc={DEFAULT_MEMBER_PHOTO_PLACEHOLDER}
                      alt={member.name}
                      loading="lazy"
                      containerClassName="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border border-stone-200 group-hover:border-teal-700/60 transition-colors"
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    />
                    <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#121918] text-teal-300 border border-stone-700 font-bold text-[10px] px-3 py-1 rounded-md uppercase tracking-wider z-10">
                      {member.role}
                    </span>
                  </div>
                  <h4 className="font-black text-stone-900 group-hover:text-teal-700 transition-colors text-lg sm:text-xl mt-3 leading-snug">{member.name}</h4>
                  <p className="text-xs text-stone-500 mt-1 font-medium">{member.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 8 KELURAHAN DETAIL */}
      <section className="bg-stone-100/80 py-16 md:py-20 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-10 sm:mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
              Kewilayahan
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
              8 Kelurahan Kecamatan Tangerang
            </h2>
            <p className="text-stone-600 text-sm">
              Forum UMKM KUAT hadir mengakar hingga tingkat RT/RW di delapan kelurahan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {KELURAHAN_LIST.map((kel, idx) => (
              <div
                key={kel}
                className="card-hover-interactive bg-white p-6 rounded-2xl border border-stone-200 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-stone-400 tabular-nums">0{idx + 1}</span>
                  <span className="text-[10px] bg-stone-100 border border-stone-200 text-stone-700 px-2 py-0.5 rounded font-bold uppercase">
                    Kelurahan
                  </span>
                </div>
                <h4 className="font-bold text-lg text-stone-900">Kel. {kel}</h4>
                <p className="text-xs text-stone-500 leading-relaxed">
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
