import React, { useState } from 'react';
import { Member } from '../types';
import { OFFICIAL_LOGO_URL } from './UmkmKuatLogo';
import {
  Printer,
  X,
  CreditCard,
  Download,
  CheckCircle2,
  Layers,
  Sparkles,
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
      return `${day}-${month}-${year}`;
    } catch (e) {
      return '26-10-2029';
    }
  };

  const validThru = computeValidThru();

  // Printable function using isolated iframe for 100% reliable printing/PDF generation
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
              font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
            }
            body {
              background: #ffffff;
              color: #000000;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 25px;
              padding: 20px;
            }
            .kta-card {
              width: 85.6mm;
              height: 54mm;
              border-radius: 3.5mm;
              overflow: hidden;
              box-shadow: none;
              border: 0.6mm solid #143872;
              position: relative;
              background: #ffffff;
              page-break-inside: avoid;
              margin: 0 auto 10mm auto;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .header-bar {
              background: #143872;
              height: 12.5mm;
              position: relative;
              display: flex;
              align-items: center;
              justify-content: flex-end;
              padding-right: 4mm;
            }
            .header-text {
              text-align: right;
              color: #ffffff;
            }
            .header-title-1, .header-title-2 {
              font-size: 3.1mm;
              font-weight: 800;
              letter-spacing: 0.1mm;
              line-height: 1.15;
            }
            .logo-circle {
              position: absolute;
              left: 3.5mm;
              top: 1.5mm;
              width: 15mm;
              height: 15mm;
              border-radius: 50%;
              background: #ffffff;
              border: 0.7mm solid #143872;
              overflow: hidden;
              z-index: 10;
            }
            .logo-circle img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .stripe-line {
              height: 0.8mm;
              background: #143872;
              border-top: 0.3mm solid #ffffff;
            }
            .card-body {
              display: flex;
              padding: 2.5mm 3.5mm;
              gap: 3mm;
              height: calc(54mm - 12.5mm - 0.8mm - 2.5mm);
              align-items: center;
              background: linear-gradient(135deg, #ffffff 60%, #edf4fc 100%);
              box-sizing: border-box;
            }
            .photo-box {
              width: 21mm;
              height: 28mm;
              border-radius: 2mm;
              background: #d4e5f7;
              border: 0.4mm solid #143872;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              font-weight: 800;
              font-size: 2.2mm;
              color: #143872;
              overflow: hidden;
              flex-shrink: 0;
            }
            .photo-box img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .info-table {
              flex: 1;
              font-size: 2.3mm;
              line-height: 1.45;
              color: #0f172a;
              font-weight: 600;
            }
            .info-row {
              display: flex;
              margin-bottom: 0.6mm;
            }
            .info-label {
              width: 16mm;
              font-weight: 700;
              color: #0f172a;
            }
            .info-colon {
              width: 2mm;
              font-weight: 700;
            }
            .info-val {
              flex: 1;
              font-weight: 700;
              color: #000000;
            }
            .rules-list {
              font-size: 2mm;
              line-height: 1.4;
              color: #1e293b;
              font-weight: 600;
              padding-left: 3mm;
            }
            .rules-list li {
              margin-bottom: 0.8mm;
            }
            .ttd-box {
              width: 25mm;
              height: 28mm;
              border-radius: 2mm;
              background: #d4e5f7;
              border: 0.4mm solid #143872;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              padding: 1.5mm 1mm;
              text-align: center;
              flex-shrink: 0;
              box-sizing: border-box;
            }
            .ttd-title {
              font-size: 1.9mm;
              font-weight: 800;
              color: #143872;
              line-height: 1.15;
            }
            .stamp-badge {
              width: 11mm;
              height: 11mm;
              border: 0.3mm dashed #1e40af;
              border-radius: 50%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              color: #1e40af;
              font-size: 1.4mm;
              font-weight: 800;
              text-align: center;
              transform: rotate(-8deg);
              opacity: 0.9;
              line-height: 1;
            }
            .ttd-name {
              font-size: 1.9mm;
              font-weight: 800;
              color: #0f172a;
              border-top: 0.3mm solid #143872;
              width: 100%;
              padding-top: 0.6mm;
            }
            .bottom-bar {
              height: 2.5mm;
              background: #143872;
            }
            .print-note {
              font-size: 11px;
              color: #64748b;
              text-align: center;
              margin-top: 4px;
            }
          </style>
        </head>
        <body>
          <h2 style="font-size: 14px; color: #143872; font-weight: 800; text-align: center; margin-bottom: 2px;">
            KARTU TANDA ANGGOTA (KTA) RESMI FORUM UMKM KECAMATAN TANGERANG
          </h2>
          <div class="print-note">Ukuran standar kartu ID (ISO 7810 ID-1 / PVC Card: 85.60 mm × 53.98 mm). Skala 1:1 siap potong & cetak.</div>
          <div style="margin-top: 15px;">
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
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 my-6 flex flex-col max-h-[94vh]">
        {/* Top Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Kartu Anggota UMK Kecamatan Tangerang
              </h3>
              <p className="text-[11px] text-teal-300 font-mono">
                {member.memberNumber} &bull; {member.fullName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintKTA}
              className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF KTA</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
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
            <span>Ukuran Kartu: 85.60 mm × 53.98 mm (Standar CR-80)</span>
          </div>
        </div>

        {/* Card Canvas Scroll Area */}
        <div className="p-4 sm:p-8 bg-slate-200/80 overflow-y-auto flex flex-col items-center justify-center space-y-8">
          <div id="kta-cards-container" className="flex flex-col items-center gap-8 w-full max-w-[480px]">
            {/* 1. FRONT CARD (TAMPILAN DEPAN) */}
            {(activeSide === 'both' || activeSide === 'front') && (
              <div className="kta-card w-full aspect-[85.6/53.98] bg-white rounded-[18px] sm:rounded-[20px] overflow-hidden shadow-xl border border-slate-300 relative flex flex-col justify-between select-none">
                {/* Header Blue Bar */}
                <div className="bg-[#143872] h-[22%] min-h-[52px] sm:min-h-[64px] relative flex items-center justify-end px-4 sm:px-5 text-white">
                  {/* Round Official Logo on Left */}
                  <div className="absolute left-[14px] sm:left-[18px] top-[6px] sm:top-[8px] w-[62px] h-[62px] sm:w-[74px] sm:h-[74px] rounded-full bg-white border-[3px] border-[#143872] overflow-hidden shadow-md z-20 flex items-center justify-center">
                    <img
                      src={OFFICIAL_LOGO_URL}
                      alt="Logo UMKM KUAT"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Header Title */}
                  <div className="text-right leading-tight">
                    <div className="font-extrabold text-[13px] sm:text-[16px] tracking-wide text-white">
                      KARTU ANGGOTA UMK
                    </div>
                    <div className="font-extrabold text-[13px] sm:text-[16px] tracking-wide text-white">
                      KECAMATAN TANGERANG
                    </div>
                  </div>
                </div>

                {/* Separator Stripe Line */}
                <div className="h-[3px] sm:h-[4px] bg-[#143872] border-t-[1px] border-white"></div>

                {/* Card Body */}
                <div className="flex-1 flex items-center px-3.5 sm:px-5 py-2 sm:py-3 gap-2.5 sm:gap-4 bg-gradient-to-br from-white via-white to-blue-50/40 min-h-0">
                  {/* Photo Frame (3x4 cm ratio) */}
                  <div className="w-[88px] sm:w-[110px] h-[115px] sm:h-[145px] rounded-xl sm:rounded-[14px] bg-[#D4E5F7] border-[1.5px] sm:border-2 border-[#143872] overflow-hidden flex flex-col items-center justify-center text-center flex-shrink-0 shadow-2xs">
                    {member.memberPhoto ? (
                      <img
                        src={member.memberPhoto}
                        alt={member.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="p-1.5 text-[#143872] font-black leading-tight">
                        <div className="text-[11px] sm:text-[13px] uppercase">FOTO</div>
                        <div className="text-[11px] sm:text-[13px] uppercase">ANGGOTA</div>
                        <div className="text-[10px] sm:text-[12px] font-bold mt-1 text-slate-700">3x4 CM</div>
                      </div>
                    )}
                  </div>

                  {/* Info Table */}
                  <div className="flex-1 text-[10.5px] sm:text-[12px] text-slate-900 font-semibold space-y-1 sm:space-y-1.5 leading-tight min-w-0">
                    <div className="flex items-start">
                      <span className="w-[70px] sm:w-[85px] text-slate-800 font-bold flex-shrink-0">No. Anggota</span>
                      <span className="w-[10px] sm:w-[12px] font-bold">:</span>
                      <span className="flex-1 font-bold text-slate-950 font-mono text-[10px] sm:text-[12px] truncate">
                        {member.memberNumber}
                      </span>
                    </div>

                    <div className="flex items-start">
                      <span className="w-[70px] sm:w-[85px] text-slate-800 font-bold flex-shrink-0">Nama Pemilik</span>
                      <span className="w-[10px] sm:w-[12px] font-bold">:</span>
                      <span className="flex-1 font-bold text-slate-950 truncate">
                        {member.fullName}
                      </span>
                    </div>

                    <div className="flex items-start">
                      <span className="w-[70px] sm:w-[85px] text-slate-800 font-bold flex-shrink-0">Nama Usaha</span>
                      <span className="w-[10px] sm:w-[12px] font-bold">:</span>
                      <span className="flex-1 font-bold text-[#143872] truncate">
                        {member.businessName}
                      </span>
                    </div>

                    <div className="flex items-start">
                      <span className="w-[70px] sm:w-[85px] text-slate-800 font-bold flex-shrink-0">NIB</span>
                      <span className="w-[10px] sm:w-[12px] font-bold">:</span>
                      <span className="flex-1 font-bold text-slate-900 font-mono text-[10.5px] sm:text-[12px] truncate">
                        {member.legalities && member.legalities.includes('NIB')
                          ? member.legalities
                          : member.nik || 'Terverifikasi OSS'}
                      </span>
                    </div>

                    <div className="flex items-start">
                      <span className="w-[70px] sm:w-[85px] text-slate-800 font-bold flex-shrink-0">Jenis Usaha</span>
                      <span className="w-[10px] sm:w-[12px] font-bold">:</span>
                      <span className="flex-1 font-bold text-slate-950 truncate">
                        {member.category}
                      </span>
                    </div>

                    <div className="flex items-start">
                      <span className="w-[70px] sm:w-[85px] text-slate-800 font-bold flex-shrink-0">Valid Thru</span>
                      <span className="w-[10px] sm:w-[12px] font-bold">:</span>
                      <span className="flex-1 font-bold text-slate-950 font-mono">
                        {validThru}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="h-[10px] sm:h-[12px] bg-[#143872] w-full"></div>
              </div>
            )}

            {/* 2. BACK CARD (TAMPILAN BELAKANG) */}
            {(activeSide === 'both' || activeSide === 'back') && (
              <div className="kta-card w-full aspect-[85.6/53.98] bg-white rounded-[18px] sm:rounded-[20px] overflow-hidden shadow-xl border border-slate-300 relative flex flex-col justify-between select-none">
                {/* Header Blue Bar */}
                <div className="bg-[#143872] h-[22%] min-h-[52px] sm:min-h-[64px] relative flex items-center justify-end px-4 sm:px-5 text-white">
                  {/* Round Official Logo on Left */}
                  <div className="absolute left-[14px] sm:left-[18px] top-[6px] sm:top-[8px] w-[62px] h-[62px] sm:w-[74px] sm:h-[74px] rounded-full bg-white border-[3px] border-[#143872] overflow-hidden shadow-md z-20 flex items-center justify-center">
                    <img
                      src={OFFICIAL_LOGO_URL}
                      alt="Logo UMKM KUAT"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Header Title */}
                  <div className="text-right leading-tight">
                    <div className="font-extrabold text-[13px] sm:text-[16px] tracking-wide text-white">
                      KARTU ANGGOTA UMK
                    </div>
                    <div className="font-extrabold text-[13px] sm:text-[16px] tracking-wide text-white">
                      KECAMATAN TANGERANG
                    </div>
                  </div>
                </div>

                {/* Separator Stripe Line */}
                <div className="h-[3px] sm:h-[4px] bg-[#143872] border-t-[1px] border-white"></div>

                {/* Card Body Back */}
                <div className="flex-1 flex items-center px-3.5 sm:px-5 py-2 sm:py-3 gap-2.5 sm:gap-4 bg-gradient-to-br from-white via-white to-blue-50/40 min-h-0">
                  {/* Signature and Stamp Box */}
                  <div className="w-[110px] sm:w-[135px] h-[115px] sm:h-[145px] rounded-xl sm:rounded-[14px] bg-[#D4E5F7] border-[1.5px] sm:border-2 border-[#143872] flex flex-col items-center justify-between p-1.5 sm:p-2 text-center flex-shrink-0 shadow-2xs">
                    <div className="text-[9.5px] sm:text-[11px] font-black text-[#143872] leading-tight">
                      TTD & CAP<br />KETUA FORUM
                    </div>

                    {/* Stamp and digital sign mark */}
                    <div className="relative w-12 h-10 sm:w-16 sm:h-12 flex items-center justify-center">
                      <div className="stamp-badge w-11 h-11 sm:w-14 sm:h-14 rounded-full border-[1.5px] sm:border-2 border-dashed border-blue-700 flex flex-col items-center justify-center text-[6.5px] sm:text-[7.5px] font-black text-blue-800 rotate-[-8deg] opacity-80 leading-none">
                        <span>FORUM UMKM</span>
                        <span className="text-[7.5px] sm:text-[9px] text-red-600 font-bold my-0.5">KUAT</span>
                        <span>KEC. TANGERANG</span>
                      </div>
                    </div>

                    {/* Official Name */}
                    <div className="w-full border-t-[1.5px] border-[#143872] pt-0.5 sm:pt-1">
                      <div className="font-black text-[9.5px] sm:text-[11px] text-slate-900 tracking-wider">
                        EMUS MUSLIHANT
                      </div>
                    </div>
                  </div>

                  {/* Rules & Information */}
                  <div className="flex-1 text-[9.5px] sm:text-[11px] text-slate-800 leading-snug font-medium pl-1">
                    <ol className="list-decimal pl-3.5 space-y-0.5 sm:space-y-1">
                      <li>Kartu tanda anggota resmi Forum UMKM Kecamatan Tangerang.</li>
                      <li>Memperkuat identitas nama usaha binaan Kecamatan Tangerang.</li>
                      <li>Hak akses program pembinaan, pelatihan, perizinan, & bazar.</li>
                      <li>Kartu ini berlaku sah dan tidak dapat dipindahtangankan.</li>
                      <li>Menjunjung tinggi etika usaha & integritas UMKM Tangerang.</li>
                    </ol>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="h-[10px] sm:h-[12px] bg-[#143872] w-full"></div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span>Format kartu ID Card standar (PVC / Cetak Kertas Foto)</span>
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
              className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Cetak ke PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
