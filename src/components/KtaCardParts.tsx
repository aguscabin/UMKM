import React from 'react';
import { User } from 'lucide-react';
import { Member } from '../types';
import { OFFICIAL_LOGO_URL } from './UmkmKuatLogo';
import { DEFAULT_MEMBER_PHOTO_PLACEHOLDER } from '../utils/excelImport';

/**
 * QR Code resmi yang diunggah oleh admin/pengurus untuk bagian belakang KTA UMKM KUAT.
 */
export const OFFICIAL_KTA_QR_URL = '/assets/aistudio/TTD_Ketua_Forum_UMKM_9cee66fa.JPG';

/**
 * Menghitung masa berlaku KTA (3 tahun sejak tanggal bergabung).
 */
export function computeValidThru(joinDate?: string): string {
  try {
    const baseDate = joinDate ? new Date(joinDate) : new Date();
    if (Number.isNaN(baseDate.getTime())) {
      return '26/10/2029';
    }
    baseDate.setFullYear(baseDate.getFullYear() + 3);
    const day = String(baseDate.getDate()).padStart(2, '0');
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const year = baseDate.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '26/10/2029';
  }
}

/**
 * Menunggu seluruh gambar (foto profil, logo, QR code) dan webfont selesai dimuat
 * sepenuhnya sebelum proses capture PDF / Print dimulai.
 */
export async function waitForImagesAndFonts(container: HTMLElement): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore font readiness errors
    }
  }

  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) {
        return img.decode ? img.decode().catch(() => undefined) : Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 6000);
        const done = () => {
          clearTimeout(timeout);
          if (img.decode) {
            img.decode().catch(() => undefined).finally(resolve);
          } else {
            resolve();
          }
        };
        img.addEventListener('load', done, { once: true });
        img.addEventListener(
          'error',
          () => {
            clearTimeout(timeout);
            resolve();
          },
          { once: true }
        );
      });
    })
  );

  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );
}

/**
 * Mengonversi URL gambar (lokal maupun eksternal yang mengizinkan CORS) menjadi Data URL
 * agar html2canvas selalu dapat me-render foto tanpa kendala blank / tainted canvas.
 */
export async function toCorsSafeDataUrl(src: string): Promise<string | null> {
  if (!src) return null;
  if (src.startsWith('data:')) return src;

  return new Promise((resolve) => {
    const img = new Image();
    if (/^https?:\/\//i.test(src)) {
      img.crossOrigin = 'anonymous';
      img.referrerPolicy = 'no-referrer';
    }
    const timeout = setTimeout(() => resolve(null), 5000);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 300;
        canvas.height = img.naturalHeight || 300;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => {
      clearTimeout(timeout);
      resolve(null);
    };
    img.src = src;
  });
}

interface KtaFrontCardProps {
  member: Member;
  safeLogoUrl?: string;
  safeMemberPhoto?: string;
  validThru?: string;
  widthClass?: string;
}

export const KtaFrontCard: React.FC<KtaFrontCardProps> = ({
  member,
  safeLogoUrl = OFFICIAL_LOGO_URL,
  safeMemberPhoto,
  validThru,
  widthClass = 'w-[295px] sm:w-[320px]',
}) => {
  const displayValidThru = validThru || computeValidThru(member.joinDate);
  const photoSrc = safeMemberPhoto !== undefined ? safeMemberPhoto : member.memberPhoto || '';
  const displayNikOrNib =
    member.nik && member.nik.trim() !== ''
      ? member.nik.trim()
      : member.legalities || 'Terverifikasi OSS';

  return (
    <div
      className={`kta-card ${widthClass} aspect-[53.98/85.60] bg-white rounded-[22px] overflow-hidden shadow-2xl border border-slate-300 relative flex flex-col justify-between select-none flex-shrink-0`}
    >
      {/* SVG Geometric Background Layers */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg
          viewBox="0 0 320 508"
          className="w-full h-full"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top-Right Sky Accent */}
          <polygon points="215,0 270,0 200,80 170,70" fill="#00A3FF" />
          <polygon points="270,0 320,0 320,35 240,65" fill="#38BDF8" opacity="0.6" />

          {/* Top-Left Main Royal Blue Diagonal Shape */}
          <polygon points="0,0 220,0 185,75 115,145 0,225" fill="#0D50B5" />

          {/* Mid-Left Cyan Accent Triangle */}
          <polygon points="0,225 60,195 0,270" fill="#00A3FF" />

          {/* Bottom Layered Polygon Accents */}
          <polygon points="0,455 125,508 0,508" fill="#0D50B5" />
          <polygon points="65,508 230,452 320,470 320,508" fill="#00A3FF" />
          <polygon points="150,508 320,465 320,508" fill="#093C8A" />
        </svg>
      </div>

      {/* Card Content Layer */}
      <div className="relative z-10 flex flex-col justify-between h-full p-4 sm:p-5">
        {/* Top Header: Logo + Organization Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-white p-0.5 border-2 border-white shadow-md overflow-hidden flex-shrink-0">
            <img
              src={safeLogoUrl}
              alt="Logo UMKM KUAT"
              crossOrigin={safeLogoUrl.startsWith('http') ? 'anonymous' : undefined}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="leading-tight text-white drop-shadow-xs">
            <div className="font-extrabold text-[12px] sm:text-[13px] tracking-wide font-heading">
              FORUM UMKM KUAT
            </div>
            <div className="font-semibold text-[9px] sm:text-[10px] text-sky-200 tracking-wider uppercase">
              Kecamatan Tangerang
            </div>
          </div>
        </div>

        {/* Circular Member Photo Avatar */}
        <div className="flex justify-center -mt-2">
          <div className="relative">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-white shadow-xl">
              <div className="w-full h-full rounded-full border-[4px] border-[#00A3FF] overflow-hidden bg-slate-100 flex items-center justify-center">
                {photoSrc ? (
                  <img
                    src={photoSrc}
                    alt={member.fullName}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_MEMBER_PHOTO_PLACEHOLDER;
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <User className="w-12 h-12 text-[#0D50B5]" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">
                      Pas Foto
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Member Name & Job Position */}
        <div className="text-center space-y-0.5 pt-1">
          <h2 className="font-black text-[#0D50B5] text-[15px] sm:text-[17px] font-heading tracking-tight leading-tight line-clamp-1">
            {(member.fullName || 'ANGGOTA UMKM').toUpperCase()}
          </h2>
          <div className="font-extrabold text-slate-800 text-[11px] sm:text-[12px] tracking-wider uppercase font-heading line-clamp-1">
            {member.businessName || '-'}
          </div>
          <div className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">
            {member.category} &bull; ANGGOTA BINAAN
          </div>
        </div>

        {/* Data Fields Table */}
        <div className="bg-white/85 rounded-xl p-2.5 border border-slate-200/80 shadow-2xs space-y-1 text-[10px] sm:text-[11px] font-semibold">
          <div className="flex items-center">
            <span className="w-[32%] text-slate-500 font-bold uppercase text-[9.5px]">ID ANGGOTA</span>
            <span className="w-[4%] font-bold text-slate-400">:</span>
            <span className="w-[64%] font-mono font-bold text-[#0D50B5] truncate">
              {member.memberNumber}
            </span>
          </div>

          <div className="flex items-center">
            <span className="w-[32%] text-slate-500 font-bold uppercase text-[9.5px]">NIK / NIB</span>
            <span className="w-[4%] font-bold text-slate-400">:</span>
            <span className="w-[64%] font-mono font-bold text-slate-900 truncate tabular-nums">
              {displayNikOrNib}
            </span>
          </div>

          <div className="flex items-center">
            <span className="w-[32%] text-slate-500 font-bold uppercase text-[9.5px]">KELURAHAN</span>
            <span className="w-[4%] font-bold text-slate-400">:</span>
            <span className="w-[64%] font-bold text-slate-900 truncate">
              Kel. {member.kelurahan}
            </span>
          </div>

          <div className="flex items-center">
            <span className="w-[32%] text-slate-500 font-bold uppercase text-[9.5px]">KONTAK/WA</span>
            <span className="w-[4%] font-bold text-slate-400">:</span>
            <span className="w-[64%] font-bold text-slate-900 truncate tabular-nums">
              {member.businessPhone || member.phone || '-'}
            </span>
          </div>

          <div className="flex items-center">
            <span className="w-[32%] text-slate-500 font-bold uppercase text-[9.5px]">BERLAKU S/D</span>
            <span className="w-[4%] font-bold text-slate-400">:</span>
            <span className="w-[64%] font-mono font-bold text-emerald-700 tabular-nums">
              {displayValidThru}
            </span>
          </div>
        </div>

        {/* Bottom Website Tagline */}
        <div className="text-center pt-1 pb-1">
          <span className="text-[8.5px] sm:text-[9.5px] font-semibold text-slate-600 tracking-wider">
            www.umkmkectangerang.netlify.app
          </span>
        </div>
      </div>
    </div>
  );
};

interface KtaBackCardProps {
  safeLogoUrl?: string;
  safeQrUrl?: string;
  widthClass?: string;
}

export const KtaBackCard: React.FC<KtaBackCardProps> = ({
  safeLogoUrl = OFFICIAL_LOGO_URL,
  safeQrUrl = OFFICIAL_KTA_QR_URL,
  widthClass = 'w-[295px] sm:w-[320px]',
}) => {
  const qrSrc = safeQrUrl || OFFICIAL_KTA_QR_URL;

  return (
    <div
      className={`kta-card ${widthClass} aspect-[53.98/85.60] bg-white rounded-[22px] overflow-hidden shadow-2xl border border-slate-300 relative flex flex-col justify-between select-none flex-shrink-0`}
    >
      {/* SVG Geometric Background Layers */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg
          viewBox="0 0 320 508"
          className="w-full h-full"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top-Right Royal Blue Polygon Shape */}
          <polygon points="135,0 320,0 320,230 205,145 155,70" fill="#0D50B5" />

          {/* Top-Right Cyan Accent Band */}
          <polygon points="90,0 135,0 155,70 120,60" fill="#00A3FF" />
          <polygon points="320,230 260,195 320,275" fill="#00A3FF" />

          {/* Bottom Layered Polygon Accents (Mirroring Front) */}
          <polygon points="0,455 125,508 0,508" fill="#0D50B5" />
          <polygon points="65,508 230,452 320,470 320,508" fill="#00A3FF" />
          <polygon points="150,508 320,465 320,508" fill="#093C8A" />
        </svg>
      </div>

      {/* Card Content Layer */}
      <div className="relative z-10 flex flex-col justify-between h-full p-4 sm:p-5">
        {/* Top-Right Logo Lockup */}
        <div className="flex items-center justify-end gap-2.5">
          <div className="text-right leading-tight text-white drop-shadow-xs">
            <div className="font-extrabold text-[12px] sm:text-[13px] tracking-wide font-heading">
              FORUM UMKM KUAT
            </div>
            <div className="font-semibold text-[9px] sm:text-[10px] text-sky-200 tracking-wider uppercase">
              Kecamatan Tangerang
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white p-0.5 border-2 border-white shadow-md overflow-hidden flex-shrink-0">
            <img
              src={safeLogoUrl}
              alt="Logo UMKM KUAT"
              crossOrigin={safeLogoUrl.startsWith('http') ? 'anonymous' : undefined}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Terms and Conditions Section */}
        <div className="space-y-2 pt-2">
          <div className="space-y-1">
            <h3 className="font-black text-[#0D50B5] text-[13px] sm:text-[15px] font-heading tracking-wide leading-tight">
              TERMS<br />AND CONDITIONS :
            </h3>
            <div className="w-10 h-[3px] bg-[#0D50B5] rounded-full"></div>
          </div>

          <ul className="space-y-1.5 text-[9.5px] sm:text-[10.5px] text-slate-700 leading-relaxed font-medium">
            <li className="flex items-start gap-1.5">
              <span className="text-[#0D50B5] font-black leading-none text-xs mt-0.5">&bull;</span>
              <span>Kartu ini adalah bukti sah keanggotaan Forum UMKM KUAT Kecamatan Tangerang.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-[#0D50B5] font-black leading-none text-xs mt-0.5">&bull;</span>
              <span>Berhak memperoleh pendampingan NIB OSS, sertifikasi Halal, pelatihan wirausaha, dan kurasi bazar.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-[#0D50B5] font-black leading-none text-xs mt-0.5">&bull;</span>
              <span>Kartu bersifat personal dan tidak dapat dipindahtangankan kepada pihak lain.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-[#0D50B5] font-black leading-none text-xs mt-0.5">&bull;</span>
              <span>Wajib menjaga mutu produk, etika usaha, dan nama baik pelaku UMKM Kota Tangerang.</span>
            </li>
          </ul>
        </div>

        {/* QR Code Verification Box */}
        <div className="flex flex-col items-center justify-center py-2 space-y-1">
          <div className="p-1.5 bg-white rounded-xl border border-slate-200/90 shadow-md">
            <img
              src={qrSrc}
              alt="QR Code Verifikasi KTA"
              crossOrigin={qrSrc.startsWith('http') ? 'anonymous' : undefined}
              className="w-20 h-20 object-contain"
            />
          </div>
          <span className="text-[8.5px] sm:text-[9.5px] font-bold text-[#0D50B5] tracking-widest uppercase">
            Scan untuk Verifikasi
          </span>
        </div>

        {/* Secretariat Note */}
        <div className="text-center pb-1 space-y-0.5">
          <p className="text-[8.5px] text-slate-500 italic">
            Sekretariat: Kantor Kecamatan Tangerang, Kota Tangerang
          </p>
          <p className="text-[8.5px] font-semibold text-slate-600 tracking-wider">
            www.umkmkectangerang.netlify.app
          </p>
        </div>
      </div>
    </div>
  );
};
