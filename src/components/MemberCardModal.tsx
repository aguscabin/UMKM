import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { Member } from '../types';
import { OFFICIAL_LOGO_URL } from './UmkmKuatLogo';
import {
  OFFICIAL_KTA_QR_URL,
  computeValidThru,
  waitForImagesAndFonts,
  toCorsSafeDataUrl,
  KtaFrontCard,
  KtaBackCard,
} from './KtaCardParts';
import {
  Printer,
  Download,
  X,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { InlineShimmer } from './common/Skeleton';

interface MemberCardModalProps {
  member: Member;
  onClose: () => void;
}

export const MemberCardModal: React.FC<MemberCardModalProps> = ({ member, onClose }) => {
  const [activeSide, setActiveSide] = useState<'both' | 'front' | 'back'>('both');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Gambar lokal / Data URL agar QR, Logo, dan Foto Anggota siap 100% saat export PDF
  const [safeQrUrl, setSafeQrUrl] = useState<string>(OFFICIAL_KTA_QR_URL);
  const [safeLogoUrl, setSafeLogoUrl] = useState<string>(OFFICIAL_LOGO_URL);
  const [safeMemberPhoto, setSafeMemberPhoto] = useState<string>(member.memberPhoto || '');

  const cardsContainerRef = useRef<HTMLDivElement>(null);

  const validThru = computeValidThru(member.joinDate);

  // Preload Logo, QR Resmi, & Foto Anggota ke format CORS-safe Data URL
  useEffect(() => {
    let active = true;
    toCorsSafeDataUrl(OFFICIAL_LOGO_URL).then((dataUrl) => {
      if (active && dataUrl) setSafeLogoUrl(dataUrl);
    });

    toCorsSafeDataUrl(OFFICIAL_KTA_QR_URL).then((dataUrl) => {
      if (active && dataUrl) setSafeQrUrl(dataUrl);
    });

    const rawPhoto = member.memberPhoto || '';
    setSafeMemberPhoto(rawPhoto);
    if (rawPhoto && !rawPhoto.startsWith('data:')) {
      toCorsSafeDataUrl(rawPhoto).then((dataUrl) => {
        if (active && dataUrl) setSafeMemberPhoto(dataUrl);
      });
    }

    return () => {
      active = false;
    };
  }, [member.memberPhoto]);

  /**
   * Menangkap seluruh elemen kartu (.kta-card) yang terlihat di layar menggunakan html2canvas
   * dengan useCORS: true dan scale: 2 tanpa menggunakan display: none atau hidden.
   */
  const captureVisibleCards = async (): Promise<string[]> => {
    const container = cardsContainerRef.current;
    if (!container) {
      throw new Error('Area kartu KTA tidak ditemukan.');
    }

    // Pastikan elemen kartu tidak tersembunyi (display: none / visibility: hidden)
    const computedStyle = window.getComputedStyle(container);
    if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
      throw new Error('Elemen kartu sedang tersembunyi.');
    }

    // Tunggu seluruh gambar (foto profil, logo, QR code) selesai dimuat 100%
    await waitForImagesAndFonts(container);

    const cardNodes = Array.from(container.querySelectorAll<HTMLElement>('.kta-card')).filter(
      (el) => window.getComputedStyle(el).display !== 'none' && el.offsetWidth > 0 && el.offsetHeight > 0
    );

    if (cardNodes.length === 0) {
      throw new Error('Tidak ada sisi kartu KTA yang siap ditangkap.');
    }

    const images: string[] = [];
    for (const cardEl of cardNodes) {
      await waitForImagesAndFonts(cardEl);
      const canvas = await html2canvas(cardEl, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#ffffff',
        allowTaint: false,
        logging: false,
      });
      images.push(canvas.toDataURL('image/png', 1.0));
    }

    return images;
  };

  /**
   * Download langsung file PDF KTA berukuran standar ISO 7810 ID-1 (53.98 mm × 85.60 mm) di atas kertas A4
   */
  const handleDownloadPDF = async () => {
    try {
      setIsExportingPdf(true);
      const cardDataUrls = await captureVisibleCards();

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
      const cardW = 53.98;
      const cardH = 85.60;

      // Header informasi di halaman A4
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(13, 80, 181);
      pdf.text('KARTU TANDA ANGGOTA RESMI FORUM UMKM KUAT', pageWidth / 2, 20, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text(
        `Kecamatan Tangerang • ${member.memberNumber} • ${member.fullName} (Ukuran Standar ISO 7810 ID-1: 53.98 × 85.60 mm)`,
        pageWidth / 2,
        26,
        { align: 'center' }
      );

      // Posisikan kartu sejajar di tengah halaman
      const startY = 38;
      if (cardDataUrls.length === 1) {
        const startX = (pageWidth - cardW) / 2;
        pdf.addImage(cardDataUrls[0], 'PNG', startX, startY, cardW, cardH, undefined, 'FAST');
      } else {
        const gap = 14;
        const totalW = cardW * 2 + gap;
        const startX = (pageWidth - totalW) / 2;

        pdf.addImage(cardDataUrls[0], 'PNG', startX, startY, cardW, cardH, undefined, 'FAST');
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text('Tampak Depan', startX + cardW / 2, startY + cardH + 6, { align: 'center' });

        pdf.addImage(cardDataUrls[1], 'PNG', startX + cardW + gap, startY, cardW, cardH, undefined, 'FAST');
        pdf.text('Tampak Belakang', startX + cardW + gap + cardW / 2, startY + cardH + 6, {
          align: 'center',
        });
      }

      const safeFileName = (member.fullName || 'Anggota')
        .replace(/[^a-zA-Z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '');
      pdf.save(`KTA_${member.memberNumber}_${safeFileName}.pdf`);
    } catch (err: any) {
      console.error('Gagal mengunduh PDF KTA:', err);
      alert('Gagal membuat PDF KTA: ' + (err?.message || 'Silakan coba lagi'));
    } finally {
      setIsExportingPdf(false);
    }
  };

  /**
   * Cetak langsung menggunakan gambar resolusi tinggi (scale: 2) hasil capture agar warna & tata letak 100% identik
   */
  const handlePrintKTA = async () => {
    try {
      setIsPrinting(true);
      const cardDataUrls = await captureVisibleCards();

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
        document.body.removeChild(iframe);
        window.print();
        return;
      }

      const cardsHtml = cardDataUrls
        .map(
          (url, i) => `
          <div class="card-slot">
            <img src="${url}" alt="KTA Sisi ${i + 1}" class="card-img" />
          </div>
        `
        )
        .join('');

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
                font-family: system-ui, -apple-system, sans-serif;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body {
                background: #ffffff;
                color: #000000;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 12mm 10mm;
              }
              .header-print {
                text-align: center;
                margin-bottom: 14mm;
              }
              .header-print h2 {
                font-size: 15px;
                font-weight: 800;
                color: #0d50b5;
                letter-spacing: 0.4px;
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
                gap: 14mm;
                justify-content: center;
                align-items: flex-start;
              }
              .card-slot {
                width: 53.98mm;
                height: 85.60mm;
                border-radius: 3.5mm;
                overflow: hidden;
                border: 0.2mm solid #cbd5e1;
                page-break-inside: avoid;
              }
              .card-img {
                width: 100%;
                height: 100%;
                display: block;
                object-fit: cover;
              }
            </style>
          </head>
          <body>
            <div class="header-print">
              <h2>KARTU TANDA ANGGOTA RESMI FORUM UMKM KUAT</h2>
              <p>Kecamatan Tangerang &bull; ${member.memberNumber} &bull; Ukuran Standar ISO 7810 ID-1 Portrait (53.98 mm &times; 85.60 mm)</p>
            </div>
            <div class="print-grid">
              ${cardsHtml}
            </div>
          </body>
        </html>
      `);
      doc.close();

      // Pastikan seluruh gambar hasil capture sudah ter-render di dalam iframe sebelum print()
      const iframeImgs = Array.from(doc.querySelectorAll('img'));
      await Promise.all(
        iframeImgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
                setTimeout(resolve, 3000);
              })
        )
      );

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (iframe.parentNode) document.body.removeChild(iframe);
        }, 2500);
      }, 250);
    } catch (err: any) {
      console.error('Gagal mencetak KTA:', err);
      alert('Gagal memproses cetak KTA: ' + (err?.message || 'Terjadi kesalahan'));
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/65 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden border border-stone-200 my-4 flex flex-col max-h-[95vh]">
        {/* Top Modal Header */}
        <div className="p-3.5 sm:p-4 bg-[#121918] text-white flex items-center justify-between gap-2 border-b border-stone-800">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-teal-900/50 border border-teal-700/50 flex items-center justify-center text-teal-400 flex-shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-white truncate">
                Kartu Tanda Anggota (KTA) UMKM KUAT
              </h3>
              <p className="text-[11px] text-teal-300 font-mono truncate tabular-nums">
                {member.memberNumber} &bull; {member.fullName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              type="button"
              disabled={isExportingPdf || isPrinting}
              onClick={handleDownloadPDF}
              className="btn-micro bg-teal-700 hover:bg-teal-600 text-white px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-70"
            >
              <Download className="w-4 h-4" />
              {isExportingPdf ? (
                <InlineShimmer variant="dark" label="Menyiapkan PDF KTA" widthClass="w-14 sm:w-24" />
              ) : (
                <>
                  <span className="hidden sm:inline">Download PDF</span>
                  <span className="sm:hidden">PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isExportingPdf || isPrinting}
              onClick={handlePrintKTA}
              className="btn-micro bg-stone-900 hover:bg-stone-800 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-stone-700 cursor-pointer disabled:opacity-70"
            >
              <Printer className="w-4 h-4" />
              {isPrinting ? (
                <span className="hidden sm:inline-flex">
                  <InlineShimmer variant="dark" label="Menyiapkan cetak KTA" widthClass="w-12" />
                </span>
              ) : (
                <span className="hidden sm:inline">Cetak</span>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-stone-400 hover:text-white p-1.5 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs & Dimensions Badge */}
        <div className="bg-stone-100 px-4 sm:px-6 py-2.5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveSide('both')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                activeSide === 'both' ? 'bg-[#121918] text-white' : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              Depan & Belakang
            </button>
            <button
              type="button"
              onClick={() => setActiveSide('front')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                activeSide === 'front' ? 'bg-[#121918] text-white' : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              Hanya Depan
            </button>
            <button
              type="button"
              onClick={() => setActiveSide('back')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                activeSide === 'back' ? 'bg-[#121918] text-white' : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              Hanya Belakang
            </button>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-white text-stone-700 border border-stone-300 px-2.5 py-1 rounded-md text-[11px] font-bold tabular-nums">
            <CreditCard className="w-3.5 h-3.5 text-teal-700" />
            <span>Ukuran Standar ID Card: 53.98 mm &times; 85.60 mm (Portrait CR-80)</span>
          </div>
        </div>

        {/* Card Canvas Scroll Area */}
        <div className="p-5 sm:p-10 bg-stone-200/80 overflow-y-auto flex items-start sm:items-center justify-center flex-1">
          <div
            id="kta-cards-container"
            ref={cardsContainerRef}
            className="flex flex-col sm:flex-row items-center justify-center gap-8 w-full max-w-3xl"
          >
            {/* ======================================================== */}
            {/* 1. FRONT CARD (TAMPILAN DEPAN)                           */}
            {/* ======================================================== */}
            {(activeSide === 'both' || activeSide === 'front') && (
              <KtaFrontCard
                member={member}
                safeLogoUrl={safeLogoUrl}
                safeMemberPhoto={safeMemberPhoto}
                validThru={validThru}
              />
            )}

            {/* ======================================================== */}
            {/* 2. BACK CARD (TAMPILAN BELAKANG)                         */}
            {/* ======================================================== */}
            {(activeSide === 'both' || activeSide === 'back') && (
              <KtaBackCard
                safeLogoUrl={safeLogoUrl}
                safeQrUrl={safeQrUrl}
              />
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-white border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <CheckCircle2 className="w-4 h-4 text-teal-700 flex-shrink-0" />
            <span>Format kartu ID Card vertikal standar (PVC Card / Kertas Foto Glossy)</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn-micro px-4 py-2.5 min-h-[42px] text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              disabled={isExportingPdf || isPrinting}
              onClick={handlePrintKTA}
              className="btn-micro px-4 py-2.5 min-h-[42px] bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-70"
            >
              <Printer className="w-4 h-4" />
              {isPrinting ? (
                <InlineShimmer variant="light" label="Menyiapkan cetak KTA" widthClass="w-12" />
              ) : (
                <span>Cetak</span>
              )}
            </button>
            <button
              type="button"
              disabled={isExportingPdf || isPrinting}
              onClick={handleDownloadPDF}
              className="btn-micro px-5 py-2.5 min-h-[42px] bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-70"
            >
              <Download className="w-4 h-4" />
              {isExportingPdf ? (
                <InlineShimmer variant="dark" label="Membuat PDF KTA" widthClass="w-24" />
              ) : (
                <span>Download PDF KTA</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
