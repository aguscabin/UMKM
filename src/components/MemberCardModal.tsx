import React, { useState } from 'react';
import { Member } from '../types';
import { OFFICIAL_LOGO_URL } from './UmkmKuatLogo';
import {
  Printer,
  X,
  CreditCard,
  CheckCircle2,
  Phone,
  Building2,
  ShieldCheck,
  QrCode,
  User,
} from 'lucide-react';

interface MemberCardModalProps {
  member: Member;
  onClose: () => void;
}

export const MemberCardModal: React.FC<MemberCardModalProps> = ({ member, onClose }) => {
  const [activeSide, setActiveSide] = useState<'both' | 'front' | 'back'>('both');

  // Compute Valid Thru (3 years from joinDate or today)
  const computeValidThru = () => {
    try {
      const baseDate = member.joinDate ? new Date(member.joinDate) : new Date();
      baseDate.setFullYear(baseDate.getFullYear() + 3);
      const day = String(baseDate.getDate()).padStart(2, '0');
      const month = String(baseDate.getMonth() + 1).padStart(2, '0');
      const year = baseDate.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return '26/10/2029';
    }
  };

  const validThru = computeValidThru();

  // Verification URL for QR code
  const verifyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?tab=direktori&search=${encodeURIComponent(member.memberNumber)}`
    : `https://umkmkuat-tangerang.id/verify/${member.memberNumber}`;

  // Direct QR Code generator URL with matching Royal Blue color (#0D50B5)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    verifyUrl
  )}&color=0d50b5&bgcolor=ffffff`;

  // Print function using isolated iframe for exact ISO 7810 ID-1 standard (53.98 mm × 85.60 mm portrait)
  const handlePrintKTA = () => {
    const printArea = document.getElementById('kta-cards-container');
    if (!printArea) {
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>KTA UMKM KUAT - ${member.memberNumber} - ${member.fullName}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              font-family: 'Outfit', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              background: #ffffff;
              color: #000000;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .header-print {
              text-align: center;
              margin-bottom: 20px;
            }
            .header-print h2 {
              font-size: 16px;
              font-weight: 800;
              color: #0d50b5;
              letter-spacing: 0.5px;
            }
            .header-print p {
              font-size: 11px;
              color: #64748b;
              margin-top: 4px;
            }
            .print-grid {
              display: flex;
              flex-direction: row;
              flex-wrap: wrap;
              gap: 20mm;
              justify-content: center;
              align-items: center;
            }
            .kta-card {
              width: 53.98mm;
              height: 85.60mm;
              border-radius: 3.5mm;
              overflow: hidden;
              position: relative;
              background: #ffffff;
              box-shadow: 0 0 0 0.3mm #0d50b5;
              page-break-inside: avoid;
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          <div class="header-print">
            <h2>KARTU TANDA ANGGOTA RESMI FORUM UMKM KUAT</h2>
            <p>Kecamatan Tangerang &bull; Ukuran Standar ISO 7810 ID-1 Portrait (53.98 mm &times; 85.60 mm) &bull; Skala 1:1</p>
          </div>
          <div class="print-grid">
            ${printArea.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 my-6 flex flex-col max-h-[94vh]">
        {/* Top Modal Header */}
        <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Kartu Tanda Anggota (KTA) UMKM KUAT
              </h3>
              <p className="text-[11px] text-blue-300 font-mono">
                {member.memberNumber} &bull; {member.fullName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintKTA}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-105"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF KTA</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs & Dimensions Badge */}
        <div className="bg-slate-100 px-4 sm:px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveSide('both')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                activeSide === 'both' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Depan & Belakang
            </button>
            <button
              onClick={() => setActiveSide('front')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                activeSide === 'front' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hanya Depan
            </button>
            <button
              onClick={() => setActiveSide('back')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                activeSide === 'back' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hanya Belakang
            </button>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-1 rounded-md text-[11px] font-bold">
            <CreditCard className="w-3.5 h-3.5 text-blue-700" />
            <span>Ukuran Standar ID Card: 53.98 mm &times; 85.60 mm (Portrait CR-80)</span>
          </div>
        </div>

        {/* Card Canvas Scroll Area */}
        <div className="p-6 sm:p-10 bg-slate-200/90 overflow-y-auto flex items-center justify-center">
          <div
            id="kta-cards-container"
            className="flex flex-col sm:flex-row items-center justify-center gap-8 w-full max-w-3xl"
          >
            {/* ======================================================== */}
            {/* 1. FRONT CARD (TAMPILAN DEPAN)                           */}
            {/* ======================================================== */}
            {(activeSide === 'both' || activeSide === 'front') && (
              <div className="kta-card w-[295px] sm:w-[320px] aspect-[53.98/85.60] bg-white rounded-[22px] overflow-hidden shadow-2xl border border-slate-300 relative flex flex-col justify-between select-none">
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
                        src={OFFICIAL_LOGO_URL}
                        alt="Logo UMKM KUAT"
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
                          {member.memberPhoto ? (
                            <img
                              src={member.memberPhoto}
                              alt={member.fullName}
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
                      {member.fullName.toUpperCase()}
                    </h2>
                    <div className="font-extrabold text-slate-800 text-[11px] sm:text-[12px] tracking-wider uppercase font-heading">
                      {member.businessName}
                    </div>
                    <div className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">
                      {member.category} &bull; ANGGOTA BINAAN
                    </div>
                  </div>

                  {/* Data Fields Table */}
                  <div className="bg-white/80 backdrop-blur-2xs rounded-xl p-2.5 border border-slate-200/80 shadow-2xs space-y-1 text-[10px] sm:text-[11px] font-semibold">
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
                      <span className="w-[64%] font-mono font-bold text-slate-900 truncate">
                        {member.legalities && member.legalities.includes('NIB')
                          ? member.legalities
                          : member.nik || 'Terverifikasi OSS'}
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
                      <span className="w-[64%] font-bold text-slate-900 truncate">
                        {member.businessPhone || member.phone || '-'}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <span className="w-[32%] text-slate-500 font-bold uppercase text-[9.5px]">BERLAKU S/D</span>
                      <span className="w-[4%] font-bold text-slate-400">:</span>
                      <span className="w-[64%] font-mono font-bold text-emerald-700">
                        {validThru}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Website Tagline */}
                  <div className="text-center pt-1 pb-1">
                    <span className="text-[9px] font-semibold text-slate-600 tracking-wider">
                      www.umkmkuattangerang.id
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 2. BACK CARD (TAMPILAN BELAKANG)                         */}
            {/* ======================================================== */}
            {(activeSide === 'both' || activeSide === 'back') && (
              <div className="kta-card w-[295px] sm:w-[320px] aspect-[53.98/85.60] bg-white rounded-[22px] overflow-hidden shadow-2xl border border-slate-300 relative flex flex-col justify-between select-none">
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
                        src={OFFICIAL_LOGO_URL}
                        alt="Logo UMKM KUAT"
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
                    <div className="p-2 bg-white rounded-xl border border-slate-200/90 shadow-md">
                      <img
                        src={qrCodeUrl}
                        alt="QR Code Verifikasi KTA"
                        className="w-18 h-18 sm:w-20 sm:h-20 object-contain"
                        onError={(e) => {
                          // Fallback to stylized SVG QR representation if offline
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <QrCode className="w-18 h-18 text-[#0D50B5] hidden [img[style*='display: none'] ~ &]:block" />
                    </div>
                    <span className="text-[8.5px] sm:text-[9.5px] font-bold text-[#0D50B5] tracking-widest uppercase">
                      Scan untuk Verifikasi
                    </span>
                  </div>

                  {/* Secretariat Note */}
                  <div className="text-center pb-1">
                    <p className="text-[8.5px] text-slate-500 italic">
                      Sekretariat: Kantor Kecamatan Tangerang, Kota Tangerang
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Format kartu ID Card vertikal standar (PVC Card / Kertas Foto Glossy)</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={handlePrintKTA}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan ke PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
