import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Member, Transaction } from '../types';
import { OFFICIAL_LOGO_URL } from '../components/UmkmKuatLogo';

export const MONTH_OPTIONS = [
  { value: 'all', label: 'Semua Bulan' },
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
] as const;

export function getMonthLabel(monthValue: string): string {
  return MONTH_OPTIONS.find((m) => m.value === monthValue)?.label || 'Semua Bulan';
}

export function getAvailableYears(transactions: Transaction[]): string[] {
  const currentYear = String(new Date().getFullYear());
  const years = new Set<string>([currentYear]);
  for (const tx of transactions) {
    const match = String(tx.date || '').match(/^(\d{4})-/);
    if (match && match[1]) {
      years.add(match[1]);
    }
  }
  return Array.from(years).sort((a, b) => b.localeCompare(a));
}

export function filterDuesTransactions(
  transactions: Transaction[],
  month: string,
  year: string
): Transaction[] {
  return transactions
    .filter((tx) => {
      if (tx.category !== 'Iuran Anggota' || tx.type !== 'pemasukan') return false;
      const dateStr = String(tx.date || '');
      const txYear = dateStr.slice(0, 4);
      const txMonth = dateStr.slice(5, 7);
      if (year !== 'all' && txYear !== year) return false;
      if (month !== 'all' && txMonth !== month) return false;
      return true;
    })
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export function resolveTransactionMember(
  tx: Transaction,
  members: Member[]
): Member | undefined {
  if (tx.memberId) {
    const byId = members.find((m) => m.id === tx.memberId);
    if (byId) return byId;
  }
  if (tx.memberNumber) {
    const numLower = tx.memberNumber.trim().toLowerCase();
    const byNumber = members.find(
      (m) => (m.memberNumber || '').trim().toLowerCase() === numLower
    );
    if (byNumber) return byNumber;
  }
  if (tx.memberName) {
    const nameLower = tx.memberName.trim().toLowerCase();
    const byName = members.find(
      (m) => (m.fullName || '').trim().toLowerCase() === nameLower
    );
    if (byName) return byName;
  }
  return undefined;
}

export interface MemberDuesRow {
  member: Member;
  isPaid: boolean;
  paidCount: number;
  totalAmount: number;
  lastPaymentDate: string;
  lastTransactionNumber: string;
  transactions: Transaction[];
}

export function buildMemberDuesSummary(
  members: Member[],
  duesTransactions: Transaction[]
): MemberDuesRow[] {
  const sortedMembers = [...members].sort((a, b) => {
    const statusOrder = (s: string) => (s === 'aktif' ? 0 : s === 'pending' ? 1 : 2);
    const diff = statusOrder(a.status) - statusOrder(b.status);
    if (diff !== 0) return diff;
    return (a.memberNumber || a.fullName).localeCompare(b.memberNumber || b.fullName);
  });

  return sortedMembers.map((member) => {
    const memberTxs = duesTransactions.filter((tx) => {
      if (tx.memberId && tx.memberId === member.id) return true;
      if (
        tx.memberNumber &&
        member.memberNumber &&
        tx.memberNumber.trim().toLowerCase() === member.memberNumber.trim().toLowerCase()
      ) {
        return true;
      }
      if (
        tx.memberName &&
        member.fullName &&
        tx.memberName.trim().toLowerCase() === member.fullName.trim().toLowerCase()
      ) {
        return true;
      }
      return false;
    });

    const approvedTxs = memberTxs.filter((tx) => tx.approvalStatus === 'disetujui');
    const totalAmount = approvedTxs.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const latestTx = approvedTxs[0] || memberTxs[0];

    return {
      member,
      isPaid: approvedTxs.length > 0 && totalAmount > 0,
      paidCount: approvedTxs.length,
      totalAmount,
      lastPaymentDate: latestTx?.date || '-',
      lastTransactionNumber: latestTx?.transactionNumber || '-',
      transactions: memberTxs,
    };
  });
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatStatusLabel(status: Transaction['approvalStatus']): string {
  if (status === 'disetujui') return 'Disetujui';
  if (status === 'menunggu') return 'Menunggu';
  return 'Ditolak';
}

function formatMemberStatusLabel(status: Member['status']): string {
  if (status === 'aktif') return 'Aktif';
  if (status === 'pending') return 'Pending';
  return 'Nonaktif';
}

function buildPeriodSlug(month: string, year: string): string {
  const mLabel = month === 'all' ? 'Semua_Bulan' : getMonthLabel(month).replace(/\s+/g, '_');
  const yLabel = year === 'all' ? 'Semua_Tahun' : year;
  return `${mLabel}_${yLabel}`;
}

export interface DuesExportParams {
  transactions: Transaction[];
  members: Member[];
  memberStatuses: MemberDuesRow[];
  month: string;
  year: string;
  viewMode: 'transaksi' | 'status_anggota';
}

export function exportDuesExcel({
  transactions,
  members,
  memberStatuses,
  month,
  year,
}: DuesExportParams): void {
  const monthLabel = getMonthLabel(month);
  const yearLabel = year === 'all' ? 'Semua Tahun' : year;
  const periodText = `${monthLabel} ${yearLabel}`;
  const printedDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const approvedTotal = transactions
    .filter((t) => t.approvalStatus === 'disetujui')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const wb = XLSX.utils.book_new();

  // Sheet 1: Daftar Transaksi Iuran Anggota
  const txRows: Array<Array<string | number>> = [
    ['FORUM UMKM KUAT KECAMATAN TANGERANG'],
    ['REKAPITULASI TRANSAKSI IURAN ANGGOTA'],
    [`Periode: ${periodText}`],
    [`Tanggal Unduh: ${printedDate}`],
    [],
    [
      'No.',
      'No. Transaksi',
      'Tanggal',
      'No. Anggota',
      'Nama Anggota',
      'Nama Usaha',
      'Kelurahan',
      'Uraian Keterangan',
      'Nominal (Rp)',
      'Pencatat',
      'Status',
    ],
  ];

  transactions.forEach((tx, idx) => {
    const matched = resolveTransactionMember(tx, members);
    txRows.push([
      idx + 1,
      tx.transactionNumber || '-',
      tx.date || '-',
      tx.memberNumber || matched?.memberNumber || '-',
      tx.memberName || matched?.fullName || '-',
      matched?.businessName || '-',
      matched?.kelurahan || '-',
      tx.description || '-',
      Number(tx.amount || 0),
      tx.recorderName || '-',
      formatStatusLabel(tx.approvalStatus),
    ]);
  });

  if (transactions.length === 0) {
    txRows.push(['-', 'Tidak ada transaksi iuran pada periode ini', '', '', '', '', '', '', 0, '', '']);
  }

  txRows.push([
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'TOTAL PENERIMAAN IURAN (DISETUJUI)',
    approvedTotal,
    '',
    '',
  ]);

  const wsTx = XLSX.utils.aoa_to_sheet(txRows);
  wsTx['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 13 },
    { wch: 20 },
    { wch: 24 },
    { wch: 24 },
    { wch: 16 },
    { wch: 38 },
    { wch: 16 },
    { wch: 22 },
    { wch: 12 },
  ];

  // Format numeric currency cells cleanly
  for (let r = 6; r < txRows.length; r++) {
    const addr = XLSX.utils.encode_cell({ r, c: 8 });
    if (wsTx[addr] && typeof wsTx[addr].v === 'number') {
      wsTx[addr].z = '#,##0';
    }
  }

  XLSX.utils.book_append_sheet(wb, wsTx, 'Transaksi Iuran');

  // Sheet 2: Status Iuran Per Anggota
  const statusRows: Array<Array<string | number>> = [
    ['FORUM UMKM KUAT KECAMATAN TANGERANG'],
    ['REKAP STATUS PEMBAYARAN IURAN PER ANGGOTA'],
    [`Periode: ${periodText}`],
    [`Tanggal Unduh: ${printedDate}`],
    [],
    [
      'No.',
      'No. Anggota',
      'Nama Anggota',
      'Nama Usaha',
      'Kelurahan',
      'Status Anggota',
      'Status Iuran Periode',
      'Jumlah Bayar',
      'Tanggal Bayar Terakhir',
      'No. Bukti Terakhir',
      'Total Iuran (Rp)',
    ],
  ];

  let totalMemberPaidAmount = 0;
  memberStatuses.forEach((row, idx) => {
    totalMemberPaidAmount += row.totalAmount;
    statusRows.push([
      idx + 1,
      row.member.memberNumber || '-',
      row.member.fullName || '-',
      row.member.businessName || '-',
      row.member.kelurahan || '-',
      formatMemberStatusLabel(row.member.status),
      row.isPaid ? 'Lunas' : 'Belum Bayar',
      row.paidCount,
      row.lastPaymentDate,
      row.lastTransactionNumber,
      row.totalAmount,
    ]);
  });

  if (memberStatuses.length === 0) {
    statusRows.push(['-', 'Belum ada data anggota terdaftar', '', '', '', '', '', 0, '-', '-', 0]);
  }

  statusRows.push([
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'TOTAL IURAN ANGGOTA',
    totalMemberPaidAmount,
  ]);

  const wsStatus = XLSX.utils.aoa_to_sheet(statusRows);
  wsStatus['!cols'] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 24 },
    { wch: 26 },
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
    { wch: 13 },
    { wch: 20 },
    { wch: 18 },
    { wch: 16 },
  ];

  for (let r = 6; r < statusRows.length; r++) {
    const addr = XLSX.utils.encode_cell({ r, c: 10 });
    if (wsStatus[addr] && typeof wsStatus[addr].v === 'number') {
      wsStatus[addr].z = '#,##0';
    }
  }

  XLSX.utils.book_append_sheet(wb, wsStatus, 'Status Per Anggota');

  const slug = buildPeriodSlug(month, year);
  XLSX.writeFile(wb, `Rekap_Iuran_Anggota_UMKM_KUAT_${slug}.xlsx`);
}

async function loadLogoAsDataUrl(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    const timeout = setTimeout(() => resolve(null), 4000);
    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 200;
        canvas.height = img.naturalHeight || 200;
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
    img.src = url;
  });
}

export async function exportDuesOfficialPdf({
  transactions,
  members,
  memberStatuses,
  month,
  year,
  viewMode,
}: DuesExportParams): Promise<void> {
  const monthLabel = getMonthLabel(month);
  const yearLabel = year === 'all' ? 'Semua Tahun' : year;
  const periodText = `${monthLabel} ${yearLabel}`;
  const printedDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const approvedTotal = transactions
    .filter((t) => t.approvalStatus === 'disetujui')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const activeMembersCount = memberStatuses.filter((r) => r.member.status === 'aktif').length;
  const paidActiveCount = memberStatuses.filter(
    (r) => r.member.status === 'aktif' && r.isPaid
  ).length;
  const paidTotalCount = memberStatuses.filter((r) => r.isPaid).length;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm

  const logoDataUrl = await loadLogoAsDataUrl(OFFICIAL_LOGO_URL);

  // 1. Official Kop Surat (Page 1)
  if (logoDataUrl) {
    try {
      pdf.addImage(logoDataUrl, 'PNG', marginX + 1, 10, 19, 19, undefined, 'FAST');
    } catch {
      // ignore if image decoding fails
    }
  }

  const textCenterX = logoDataUrl ? marginX + 20 + (contentWidth - 20) / 2 : pageWidth / 2;

  pdf.setTextColor(30, 41, 59);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.text('PEMERINTAH KOTA TANGERANG  •  KECAMATAN TANGERANG', textCenterX, 14, {
    align: 'center',
  });

  pdf.setTextColor(15, 23, 42);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13.5);
  pdf.text('FORUM UMKM KUAT KECAMATAN TANGERANG', textCenterX, 20, { align: 'center' });

  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.text(
    'Sekretariat: Gedung Kantor Kecamatan Tangerang, Jl. Daan Mogot No. 5, Kota Tangerang',
    textCenterX,
    24.8,
    { align: 'center' }
  );
  pdf.text(
    'Telp: (021) 5523456  |  WhatsApp: +62 82258570582  |  Email: umkmkectangerang@gmail.com',
    textCenterX,
    28.6,
    { align: 'center' }
  );

  // Double horizontal line below Kop Surat
  pdf.setDrawColor(15, 23, 42);
  pdf.setLineWidth(0.7);
  pdf.line(marginX, 32, pageWidth - marginX, 32);
  pdf.setLineWidth(0.25);
  pdf.line(marginX, 33.2, pageWidth - marginX, 33.2);

  // 2. Document Title
  let y = 41;
  pdf.setTextColor(15, 23, 42);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  const docTitle =
    viewMode === 'status_anggota'
      ? 'LAPORAN REKAPITULASI STATUS IURAN PER ANGGOTA'
      : 'LAPORAN REKAPITULASI TRANSAKSI IURAN ANGGOTA';
  pdf.text(docTitle, pageWidth / 2, y, { align: 'center' });
  const titleWidth = pdf.getTextWidth(docTitle);
  pdf.setLineWidth(0.35);
  pdf.line(pageWidth / 2 - titleWidth / 2, y + 1.2, pageWidth / 2 + titleWidth / 2, y + 1.2);

  y += 6;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(51, 65, 85);
  pdf.text(`Periode: ${periodText}   •   Dicetak pada: ${printedDate}`, pageWidth / 2, y, {
    align: 'center',
  });

  // 3. Summary Box
  y += 5;
  const boxH = 15;
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.25);
  pdf.roundedRect(marginX, y, contentWidth, boxH, 1.5, 1.5, 'FD');

  const colW3 = contentWidth / 3;
  pdf.line(marginX + colW3, y + 2, marginX + colW3, y + boxH - 2);
  pdf.line(marginX + colW3 * 2, y + 2, marginX + colW3 * 2, y + boxH - 2);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Total Penerimaan Iuran (Disetujui)', marginX + 4, y + 5.2);
  pdf.text('Jumlah Transaksi Iuran', marginX + colW3 + 4, y + 5.2);
  pdf.text('Partisipasi Anggota Terdaftar', marginX + colW3 * 2 + 4, y + 5.2);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 118, 110);
  pdf.text(formatRupiah(approvedTotal), marginX + 4, y + 11.2);

  pdf.setTextColor(15, 23, 42);
  pdf.text(`${transactions.length} Transaksi`, marginX + colW3 + 4, y + 11.2);

  const partisipasiText =
    activeMembersCount > 0
      ? `${paidActiveCount} / ${activeMembersCount} Anggota Aktif`
      : `${paidTotalCount} / ${memberStatuses.length} Anggota`;
  pdf.text(partisipasiText, marginX + colW3 * 2 + 4, y + 11.2);

  y += boxH + 6;

  // 4. Table Setup
  interface ColDef {
    header: string;
    width: number;
    align?: 'left' | 'center' | 'right';
  }

  const columns: ColDef[] =
    viewMode === 'status_anggota'
      ? [
          { header: 'No', width: 9, align: 'center' },
          { header: 'No. Anggota', width: 29, align: 'left' },
          { header: 'Nama Anggota', width: 34, align: 'left' },
          { header: 'Nama Usaha', width: 35, align: 'left' },
          { header: 'Kelurahan', width: 23, align: 'left' },
          { header: 'Tgl Bayar', width: 18, align: 'center' },
          { header: 'Status', width: 15, align: 'center' },
          { header: 'Iuran (Rp)', width: 19, align: 'right' },
        ]
      : [
          { header: 'No', width: 9, align: 'center' },
          { header: 'No. Bukti', width: 24, align: 'left' },
          { header: 'Tanggal', width: 20, align: 'center' },
          { header: 'Nama Anggota / Usaha', width: 44, align: 'left' },
          { header: 'Keterangan', width: 45, align: 'left' },
          { header: 'Status', width: 16, align: 'center' },
          { header: 'Nominal (Rp)', width: 24, align: 'right' },
        ];

  const drawTableHeader = (topY: number): number => {
    const headerH = 8;
    pdf.setFillColor(18, 25, 24);
    pdf.setDrawColor(18, 25, 24);
    pdf.rect(marginX, topY, contentWidth, headerH, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(255, 255, 255);

    let xCursor = marginX;
    for (const col of columns) {
      const textY = topY + 5.2;
      if (col.align === 'right') {
        pdf.text(col.header, xCursor + col.width - 2, textY, { align: 'right' });
      } else if (col.align === 'center') {
        pdf.text(col.header, xCursor + col.width / 2, textY, { align: 'center' });
      } else {
        pdf.text(col.header, xCursor + 2, textY);
      }
      xCursor += col.width;
    }
    return topY + headerH;
  };

  y = drawTableHeader(y);

  const rowObjects: Array<{ cells: string[]; highlight?: 'paid' | 'unpaid' | 'approved' | 'other' }> =
    viewMode === 'status_anggota'
      ? memberStatuses.map((item, idx) => [
          String(idx + 1),
          item.member.memberNumber || '-',
          item.member.fullName || '-',
          item.member.businessName || '-',
          item.member.kelurahan || '-',
          item.lastPaymentDate,
          item.isPaid ? 'Lunas' : 'Belum',
          item.totalAmount > 0 ? item.totalAmount.toLocaleString('id-ID') : '0',
        ]).map((cells, idx) => ({
          cells,
          highlight: memberStatuses[idx]?.isPaid ? 'paid' : 'unpaid',
        }))
      : transactions.map((tx, idx) => {
          const matched = resolveTransactionMember(tx, members);
          const memberLabel = tx.memberName
            ? `${tx.memberName}${matched?.businessName ? ` (${matched.businessName})` : ''}`
            : matched
              ? `${matched.fullName} (${matched.businessName})`
              : '-';
          return {
            cells: [
              String(idx + 1),
              tx.transactionNumber || '-',
              tx.date || '-',
              memberLabel,
              tx.description || '-',
              formatStatusLabel(tx.approvalStatus),
              Number(tx.amount || 0).toLocaleString('id-ID'),
            ],
            highlight: tx.approvalStatus === 'disetujui' ? 'approved' : 'other',
          };
        });

  if (rowObjects.length === 0) {
    const emptyH = 12;
    pdf.setDrawColor(203, 213, 225);
    pdf.setFillColor(255, 255, 255);
    pdf.rect(marginX, y, contentWidth, emptyH, 'FD');
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text('Tidak ada data transaksi iuran anggota untuk periode ini.', pageWidth / 2, y + 7.5, {
      align: 'center',
    });
    y += emptyH;
  } else {
    pdf.setFontSize(7.2);
    for (let rIdx = 0; rIdx < rowObjects.length; rIdx++) {
      const row = rowObjects[rIdx];
      const wrappedCells = row.cells.map((cellText, cIdx) => {
        const maxW = Math.max(4, columns[cIdx].width - 3.5);
        return pdf.splitTextToSize(cellText, maxW) as string[];
      });
      const maxLines = Math.max(...wrappedCells.map((lines) => Math.max(1, lines.length)));
      const rowH = Math.max(7, maxLines * 3.6 + 3.2);

      if (y + rowH > pageHeight - 24) {
        pdf.addPage();
        y = 16;
        y = drawTableHeader(y);
      }

      const isEven = rIdx % 2 === 1;
      pdf.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
      pdf.setDrawColor(203, 213, 225);
      pdf.setLineWidth(0.2);
      pdf.rect(marginX, y, contentWidth, rowH, 'FD');

      let xCursor = marginX;
      for (let cIdx = 0; cIdx < columns.length; cIdx++) {
        const col = columns[cIdx];
        if (cIdx > 0) {
          pdf.line(xCursor, y, xCursor, y + rowH);
        }

        const isStatusCol =
          (viewMode === 'status_anggota' && cIdx === 6) ||
          (viewMode === 'transaksi' && cIdx === 5);
        const isAmountCol = cIdx === columns.length - 1;

        if (isStatusCol && row.highlight === 'paid') {
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(15, 118, 110);
        } else if (isStatusCol && row.highlight === 'unpaid') {
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(180, 83, 9);
        } else if (isAmountCol) {
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(15, 23, 42);
        } else {
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(30, 41, 59);
        }

        const lines = wrappedCells[cIdx];
        lines.forEach((line, lineIdx) => {
          const textY = y + 4.4 + lineIdx * 3.6;
          if (col.align === 'right') {
            pdf.text(line, xCursor + col.width - 2, textY, { align: 'right' });
          } else if (col.align === 'center') {
            pdf.text(line, xCursor + col.width / 2, textY, { align: 'center' });
          } else {
            pdf.text(line, xCursor + 1.8, textY);
          }
        });

        xCursor += col.width;
      }

      y += rowH;
    }
  }

  // Total Footer Row
  const totalRowH = 8.5;
  if (y + totalRowH > pageHeight - 24) {
    pdf.addPage();
    y = 16;
  }
  pdf.setFillColor(241, 245, 249);
  pdf.setDrawColor(148, 163, 184);
  pdf.setLineWidth(0.3);
  pdf.rect(marginX, y, contentWidth, totalRowH, 'FD');

  const lastColWidth = columns[columns.length - 1].width;
  const labelSpanWidth = contentWidth - lastColWidth;
  pdf.line(marginX + labelSpanWidth, y, marginX + labelSpanWidth, y + totalRowH);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);
  pdf.text('TOTAL PENERIMAAN IURAN PERIODE INI', marginX + labelSpanWidth - 3, y + 5.6, {
    align: 'right',
  });
  pdf.setTextColor(15, 118, 110);
  pdf.text(formatRupiah(approvedTotal), marginX + contentWidth - 2, y + 5.6, {
    align: 'right',
  });
  y += totalRowH;

  // 5. Official Signature Block
  const signatureNeededH = 44;
  if (y + signatureNeededH > pageHeight - 16) {
    pdf.addPage();
    y = 20;
  } else {
    y += 12;
  }

  const leftSigX = marginX + 38;
  const rightSigX = pageWidth - marginX - 38;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(30, 41, 59);
  pdf.text('Mengetahui,', leftSigX, y, { align: 'center' });
  pdf.text(`Kota Tangerang, ${printedDate}`, rightSigX, y, { align: 'center' });

  y += 4.5;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Ketua Forum UMKM KUAT', leftSigX, y, { align: 'center' });
  pdf.text('Bendahara Forum', rightSigX, y, { align: 'center' });

  y += 22;
  pdf.text('Emus Muslihant', leftSigX, y, { align: 'center' });
  const ketuaW = pdf.getTextWidth('Emus Muslihant');
  pdf.setLineWidth(0.3);
  pdf.line(leftSigX - ketuaW / 2, y + 0.8, leftSigX + ketuaW / 2, y + 0.8);

  pdf.text('Peni Martin', rightSigX, y, { align: 'center' });
  const bendaharaW = pdf.getTextWidth('Peni Martin');
  pdf.line(rightSigX - bendaharaW / 2, y + 0.8, rightSigX + bendaharaW / 2, y + 0.8);

  // Page footer on all pages
  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(148, 163, 184);
    pdf.text(
      'Dokumen Resmi Sistem Manajemen Forum UMKM KUAT Kecamatan Tangerang',
      marginX,
      pageHeight - 8
    );
    pdf.text(`Halaman ${p} dari ${totalPages}`, pageWidth - marginX, pageHeight - 8, {
      align: 'right',
    });
  }

  const slug = buildPeriodSlug(month, year);
  pdf.save(`Rekap_Iuran_Resmi_UMKM_KUAT_${slug}.pdf`);
}
