import React, { useState, useMemo } from 'react';
import {
  Member,
  Transaction,
  ForumEvent,
  KELURAHAN_LIST,
  BusinessCategory,
} from '../../types';
import {
  Printer,
  Download,
} from 'lucide-react';
import { UmkmKuatLogo } from '../../components/UmkmKuatLogo';

interface AdminReportsProps {
  members: Member[];
  transactions: Transaction[];
  events: ForumEvent[];
}

const STANDARD_BUSINESS_CATEGORIES: BusinessCategory[] = [
  'Kuliner',
  'Fashion & Tekstil',
  'Kriya & Kerajinan',
  'Jasa & Konsultasi',
  'Perdagangan & Toko',
  'Pertanian & Agro',
  'Kesehatan & Kecantikan',
  'Teknologi & Digital',
  'Lainnya',
];

const MONTHS_ID = [
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

function extractYearMonth(
  primaryDate?: string,
  fallbackDate?: string
): { year: string; month: string } | null {
  const candidates = [primaryDate, fallbackDate];
  for (const raw of candidates) {
    if (!raw || typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;

    // Match YYYY-MM-DD or YYYY-MM or ISO timestamp
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})/);
    if (isoMatch) {
      return { year: isoMatch[1], month: isoMatch[2] };
    }

    // Match DD/MM/YYYY
    const dmyMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (dmyMatch) {
      return { year: dmyMatch[3], month: dmyMatch[2] };
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return {
        year: String(parsed.getFullYear()),
        month: String(parsed.getMonth() + 1).padStart(2, '0'),
      };
    }
  }
  return null;
}

export const AdminReports: React.FC<AdminReportsProps> = ({
  members,
  transactions,
  events,
}) => {
  const [reportType, setReportType] = useState<
    | 'keanggotaan'
    | 'kelurahan'
    | 'kategori'
    | 'pertumbuhan'
    | 'keuangan'
    | 'buku_kas'
    | 'iuran'
    | 'kegiatan'
  >('keanggotaan');

  const [periodYear, setPeriodYear] = useState('all');
  const [periodMonth, setPeriodMonth] = useState('all');

  const currentYearNum = new Date().getFullYear();

  const availableYears = useMemo(() => {
    const yearSet = new Set<string>([
      String(currentYearNum),
      String(currentYearNum - 1),
    ]);
    members.forEach((m) => {
      const ym = extractYearMonth(m.joinDate, m.createdAt);
      if (ym) yearSet.add(ym.year);
    });
    transactions.forEach((t) => {
      const ym = extractYearMonth(t.date, t.createdAt);
      if (ym) yearSet.add(ym.year);
    });
    events.forEach((e) => {
      const ym = extractYearMonth(e.date, e.createdAt);
      if (ym) yearSet.add(ym.year);
    });
    return Array.from(yearSet).sort((a, b) => Number(b) - Number(a));
  }, [members, transactions, events, currentYearNum]);

  const filteredMembers = useMemo(() => {
    if (periodYear === 'all' && periodMonth === 'all') return members;
    return members.filter((m) => {
      const ym = extractYearMonth(m.joinDate, m.createdAt);
      if (!ym) return false;
      const matchYear = periodYear === 'all' || ym.year === periodYear;
      const matchMonth = periodMonth === 'all' || ym.month === periodMonth;
      return matchYear && matchMonth;
    });
  }, [members, periodYear, periodMonth]);

  const filteredTransactions = useMemo(() => {
    if (periodYear === 'all' && periodMonth === 'all') return transactions;
    return transactions.filter((t) => {
      const ym = extractYearMonth(t.date, t.createdAt);
      if (!ym) return false;
      const matchYear = periodYear === 'all' || ym.year === periodYear;
      const matchMonth = periodMonth === 'all' || ym.month === periodMonth;
      return matchYear && matchMonth;
    });
  }, [transactions, periodYear, periodMonth]);

  const filteredEvents = useMemo(() => {
    if (periodYear === 'all' && periodMonth === 'all') return events;
    return events.filter((e) => {
      const ym = extractYearMonth(e.date, e.createdAt);
      if (!ym) return false;
      const matchYear = periodYear === 'all' || ym.year === periodYear;
      const matchMonth = periodMonth === 'all' || ym.month === periodMonth;
      return matchYear && matchMonth;
    });
  }, [events, periodYear, periodMonth]);

  // Sektor Usaha Distribution — directly connected to Member form's `category` field
  const sectorDistribution = useMemo(() => {
    const categoryOrder = [...STANDARD_BUSINESS_CATEGORIES] as string[];
    filteredMembers.forEach((m) => {
      const rawCat = (m.category || 'Lainnya').trim() || 'Lainnya';
      if (!categoryOrder.includes(rawCat)) {
        categoryOrder.push(rawCat);
      }
    });

    const totalAll = filteredMembers.length;

    return categoryOrder.map((category) => {
      const matched = filteredMembers.filter(
        (m) => ((m.category || 'Lainnya').trim() || 'Lainnya') === category
      );
      const aktif = matched.filter((m) => m.status === 'aktif').length;
      const pending = matched.filter((m) => m.status === 'pending').length;
      const nonaktif = matched.filter((m) => m.status === 'nonaktif').length;
      const publicCount = matched.filter((m) => Boolean(m.isPublicDirectory)).length;
      const total = matched.length;
      const percentage = totalAll > 0 ? (total / totalAll) * 100 : 0;
      const sampleBusinesses = matched
        .map((m) => m.businessName)
        .filter(Boolean)
        .slice(0, 3);

      return {
        category,
        aktif,
        pending,
        nonaktif,
        publicCount,
        total,
        percentage,
        sampleBusinesses,
      };
    });
  }, [filteredMembers]);

  // Member Growth Data — connected to Member form's `joinDate`, `status`, and `category`
  const growthTargetYear = useMemo(() => {
    if (periodYear !== 'all') return periodYear;
    const yearsFromMembers = members
      .map((m) => extractYearMonth(m.joinDate, m.createdAt)?.year)
      .filter((y): y is string => Boolean(y))
      .sort((a, b) => Number(b) - Number(a));
    return yearsFromMembers[0] || String(currentYearNum);
  }, [periodYear, members, currentYearNum]);

  const growthReportData = useMemo(() => {
    // Members who joined strictly before growthTargetYear form the baseline cumulative total
    let baselineBeforeYear = 0;
    const membersInTargetYear: Array<{
      member: Member;
      month: string;
      category: string;
    }> = [];
    const undatedMembers: Member[] = [];

    members.forEach((m) => {
      const ym = extractYearMonth(m.joinDate, m.createdAt);
      if (!ym) {
        undatedMembers.push(m);
        return;
      }
      if (Number(ym.year) < Number(growthTargetYear)) {
        baselineBeforeYear += 1;
      } else if (ym.year === growthTargetYear) {
        membersInTargetYear.push({
          member: m,
          month: ym.month,
          category: (m.category || 'Lainnya').trim() || 'Lainnya',
        });
      }
    });

    let runningCumulative = baselineBeforeYear;

    const monthlyRows = MONTHS_ID.map((mObj) => {
      const monthMembers = membersInTargetYear.filter(
        (item) => item.month === mObj.value
      );
      const newCount = monthMembers.length;
      const activeNew = monthMembers.filter(
        (item) => item.member.status === 'aktif'
      ).length;
      const pendingNew = monthMembers.filter(
        (item) => item.member.status === 'pending'
      ).length;
      const nonActiveNew = monthMembers.filter(
        (item) => item.member.status === 'nonaktif'
      ).length;

      const sectorCounts: Record<string, number> = {};
      monthMembers.forEach((item) => {
        sectorCounts[item.category] = (sectorCounts[item.category] || 0) + 1;
      });
      const sectorSummary = Object.entries(sectorCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, cnt]) => `${cat} (${cnt})`)
        .join(', ');

      const prevCumulative = runningCumulative;
      runningCumulative += newCount;

      let growthLabel = '0.0%';
      if (newCount > 0 && prevCumulative === 0) {
        growthLabel = 'Awal (+100%)';
      } else if (prevCumulative > 0) {
        const pct = (newCount / prevCumulative) * 100;
        growthLabel = `+${pct.toFixed(1)}%`;
      }

      return {
        monthValue: mObj.value,
        monthLabel: mObj.label,
        newCount,
        activeNew,
        pendingNew,
        nonActiveNew,
        sectorSummary: sectorSummary || '-',
        cumulativeTotal: runningCumulative,
        growthLabel,
      };
    });

    const visibleMonthlyRows =
      periodMonth === 'all'
        ? monthlyRows
        : monthlyRows.filter((r) => r.monthValue === periodMonth);

    // Year-to-date sector breakdown for target year
    const sectorGrowthRows = STANDARD_BUSINESS_CATEGORIES.map((cat) => cat as string)
      .concat(
        Array.from(
          new Set(
            members.map((m) => (m.category || 'Lainnya').trim() || 'Lainnya')
          )
        ).filter((c) => !STANDARD_BUSINESS_CATEGORIES.includes(c as BusinessCategory))
      )
      .map((cat) => {
        const allCat = members.filter(
          (m) => ((m.category || 'Lainnya').trim() || 'Lainnya') === cat
        );
        const yearCat = membersInTargetYear.filter((i) => i.category === cat);
        const monthFilteredCat =
          periodMonth === 'all'
            ? yearCat
            : yearCat.filter((i) => i.month === periodMonth);

        return {
          category: cat,
          newInPeriod: monthFilteredCat.length,
          activeTotal: allCat.filter((m) => m.status === 'aktif').length,
          totalAllTime: allCat.length,
          sharePct:
            members.length > 0 ? (allCat.length / members.length) * 100 : 0,
        };
      });

    return {
      targetYear: growthTargetYear,
      baselineBeforeYear,
      newInTargetYear: membersInTargetYear.length,
      undatedCount: undatedMembers.length,
      totalAllMembers: members.length,
      activeAllMembers: members.filter((m) => m.status === 'aktif').length,
      visibleMonthlyRows,
      sectorGrowthRows,
    };
  }, [members, growthTargetYear, periodMonth]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handlePrint = () => {
    window.print();
  };

  const escapeCsvCell = (val: string | number | undefined | null) => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    const periodSuffix =
      periodYear === 'all'
        ? periodMonth === 'all'
          ? 'Semua_Periode'
          : `Bulan_${periodMonth}`
        : periodMonth === 'all'
        ? periodYear
        : `${periodYear}-${periodMonth}`;
    const filename = `Laporan_${reportType}_${periodSuffix}.csv`;

    if (reportType === 'keanggotaan') {
      headers = [
        'No. Anggota',
        'Nama Lengkap',
        'Kelurahan',
        'Usaha',
        'Kategori',
        'Status',
        'Tgl Gabung',
      ];
      rows = filteredMembers.map((m) => [
        m.memberNumber,
        m.fullName,
        m.kelurahan,
        m.businessName,
        m.category,
        m.status,
        m.joinDate,
      ]);
    } else if (reportType === 'kelurahan') {
      headers = ['Kelurahan', 'Jumlah UMKM', 'Persentase (%)', 'Status Wilayah'];
      const total = filteredMembers.length || 1;
      rows = KELURAHAN_LIST.map((k) => {
        const cnt = filteredMembers.filter((m) => m.kelurahan === k).length;
        return [k, cnt, `${((cnt / total) * 100).toFixed(1)}%`, 'Terdaftar Aktif'];
      });
    } else if (reportType === 'kategori') {
      headers = [
        'No.',
        'Sektor / Kategori Usaha',
        'Aktif',
        'Pending',
        'Nonaktif',
        'Tampil Direktori',
        'Total UMKM',
        'Persentase (%)',
      ];
      rows = sectorDistribution.map((s, idx) => [
        idx + 1,
        s.category,
        s.aktif,
        s.pending,
        s.nonaktif,
        s.publicCount,
        s.total,
        `${s.percentage.toFixed(1)}%`,
      ]);
    } else if (reportType === 'pertumbuhan') {
      headers = [
        'No.',
        `Bulan (${growthReportData.targetYear})`,
        'Pendaftar Baru',
        'Aktif Baru',
        'Pending Baru',
        'Sektor Usaha Masuk',
        'Total Kumulatif',
        'Pertumbuhan (%)',
      ];
      rows = growthReportData.visibleMonthlyRows.map((r, idx) => [
        idx + 1,
        `${r.monthLabel} ${growthReportData.targetYear}`,
        r.newCount,
        r.activeNew,
        r.pendingNew,
        r.sectorSummary,
        r.cumulativeTotal,
        r.growthLabel,
      ]);
    } else if (reportType === 'keuangan' || reportType === 'buku_kas') {
      headers = [
        'No. Transaksi',
        'Tanggal',
        'Tipe',
        'Kategori',
        'Uraian',
        'Nominal',
        'Status',
      ];
      rows = filteredTransactions.map((t) => [
        t.transactionNumber,
        t.date,
        t.type,
        t.category,
        t.description,
        t.amount,
        t.approvalStatus,
      ]);
    } else if (reportType === 'iuran') {
      headers = ['No. Transaksi', 'Tanggal', 'Uraian', 'Nominal', 'Pencatat'];
      rows = filteredTransactions
        .filter((t) => t.category === 'Iuran Anggota')
        .map((t) => [
          t.transactionNumber,
          t.date,
          t.description,
          t.amount,
          t.recorderName,
        ]);
    } else if (reportType === 'kegiatan') {
      headers = [
        'Nama Kegiatan',
        'Tanggal',
        'Waktu',
        'Lokasi',
        'Penyelenggara',
        'Status',
      ];
      rows = filteredEvents.map((e) => [
        e.title,
        e.date,
        e.time,
        e.location,
        e.organizer,
        e.status,
      ]);
    }

    const csvText =
      '\uFEFF' +
      [
        headers.map(escapeCsvCell).join(','),
        ...rows.map((r) => r.map(escapeCsvCell).join(',')),
      ].join('\n');

    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectedMonthName =
    MONTHS_ID.find((m) => m.value === periodMonth)?.label || periodMonth;

  const periodLabel =
    periodYear === 'all' && periodMonth === 'all'
      ? reportType === 'pertumbuhan'
        ? `Tahun ${growthReportData.targetYear} (Kumulatif Seluruh Data)`
        : 'Seluruh Periode (Keseluruhan Data Terdaftar)'
      : periodYear !== 'all' && periodMonth === 'all'
      ? `Tahun ${periodYear}`
      : periodYear === 'all' && periodMonth !== 'all'
      ? `Bulan ${selectedMonthName} (Semua Tahun)`
      : `Bulan ${selectedMonthName} ${periodYear}`;

  const topSector = useMemo(() => {
    const sorted = [...sectorDistribution].sort((a, b) => b.total - a.total);
    return sorted[0] && sorted[0].total > 0 ? sorted[0] : null;
  }, [sectorDistribution]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 print:p-0 print:space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
            Laporan Eksekutif &amp; Statistik
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            Rekapitulasi data keanggotaan, distribusi sektor usaha, pertumbuhan anggota, dan arus kas siap cetak.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-white hover:bg-stone-50 text-stone-800 px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-teal-700" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen Resmi</span>
          </button>
        </div>
      </div>

      {/* Selectors */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 grid grid-cols-1 md:grid-cols-3 gap-3 print:hidden">
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5">
            Jenis Laporan
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 font-bold text-stone-800 focus:bg-white focus:outline-none focus:border-teal-600"
          >
            <option value="keanggotaan">1. Laporan Keanggotaan Lengkap</option>
            <option value="kelurahan">2. Laporan Anggota per Kelurahan</option>
            <option value="kategori">3. Laporan Distribusi Sektor Usaha</option>
            <option value="pertumbuhan">4. Laporan Pertumbuhan Anggota</option>
            <option value="keuangan">5. Laporan Keuangan (Arus Kas)</option>
            <option value="buku_kas">6. Laporan Buku Kas Umum</option>
            <option value="iuran">7. Rekap Iuran Anggota</option>
            <option value="kegiatan">8. Laporan Agenda &amp; Kegiatan</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5">
            Tahun Laporan
          </label>
          <select
            value={periodYear}
            onChange={(e) => setPeriodYear(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 font-medium text-stone-800 tabular-nums focus:bg-white focus:outline-none focus:border-teal-600"
          >
            <option value="all">Semua Tahun (Keseluruhan)</option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                Tahun {yr}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5">
            Bulan
          </label>
          <select
            value={periodMonth}
            onChange={(e) => setPeriodMonth(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 font-medium text-stone-800 focus:bg-white focus:outline-none focus:border-teal-600"
          >
            <option value="all">Semua Bulan (Tahunan)</option>
            {MONTHS_ID.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* DOCUMENT PREVIEW BOX (PRINTABLE VIEW WITH LETTERHEAD) */}
      <div className="bg-white rounded-2xl border border-stone-300 p-6 sm:p-10 space-y-6 print:p-0 print:border-none print:rounded-none print:space-y-5">
        {/* Official Letterhead (Kop Surat) */}
        <div className="border-b-4 border-double border-stone-900 pb-5 text-center space-y-2 relative">
          <div className="flex items-center justify-center gap-4">
            <UmkmKuatLogo size="lg" variant="icon" theme="dark" />
            <div className="text-center">
              <h2 className="text-sm sm:text-lg font-extrabold uppercase tracking-wider text-stone-900">
                Pemerintah Kota Tangerang &bull; Kecamatan Tangerang
              </h2>
              <h1 className="text-lg sm:text-2xl font-extrabold text-stone-900 tracking-tight">
                FORUM UMKM KUAT KECAMATAN TANGERANG
              </h1>
              <p className="text-[11px] sm:text-xs text-stone-600 max-w-xl mx-auto">
                Sekretariat: Gedung Kantor Kecamatan Tangerang, Jl. Daan Mogot No. 5, Kota Tangerang. Telp/WA: +62 82258570582 | Email: umkmkectangerang@gmail.com
              </p>
            </div>
          </div>
        </div>

        {/* Report Document Title */}
        <div className="text-center space-y-1">
          <h3 className="text-base sm:text-xl font-extrabold text-stone-900 uppercase underline decoration-2 underline-offset-4">
            {reportType === 'keanggotaan' && 'LAPORAN REKAPITULASI KEANGGOTAAN UMKM'}
            {reportType === 'kelurahan' && 'LAPORAN SEBARAN PELAKU USAHA PER KELURAHAN'}
            {reportType === 'kategori' && 'LAPORAN DISTRIBUSI SEKTOR KATEGORI USAHA'}
            {reportType === 'pertumbuhan' && 'LAPORAN PERKEMBANGAN & PERTUMBUHAN ANGGOTA'}
            {reportType === 'keuangan' && 'LAPORAN KEUANGAN ARUS KAS MASUK & KELUAR'}
            {reportType === 'buku_kas' && 'BUKU KAS UMUM (BKU) FORUM UMKM KUAT'}
            {reportType === 'iuran' && 'REKAPITULASI PENERIMAAN IURAN ANGGOTA'}
            {reportType === 'kegiatan' && 'LAPORAN AGENDA BAZAR & PELATIHAN KEWIRAUSAHAAN'}
          </h3>
          <p className="text-xs font-semibold text-stone-500 tabular-nums">
            Periode: {periodLabel}
          </p>
        </div>

        {/* Report Content Area — overflow-x-auto on screen ONLY; overflow-visible on PDF print so no scroll lines appear */}
        <div className="overflow-x-auto print:overflow-visible">
          {reportType === 'keanggotaan' && (
            <table className="w-full text-left text-xs print:text-[10px] border border-stone-300 tabular-nums">
              <thead className="bg-stone-100 font-bold border-b border-stone-300">
                <tr>
                  <th className="p-2 print:p-1.5 border-r border-stone-300 text-center w-9">No.</th>
                  <th className="p-2 print:p-1.5 border-r border-stone-300">No. Anggota</th>
                  <th className="p-2 print:p-1.5 border-r border-stone-300">Nama Lengkap</th>
                  <th className="p-2 print:p-1.5 border-r border-stone-300">Kelurahan</th>
                  <th className="p-2 print:p-1.5 border-r border-stone-300">Nama Usaha</th>
                  <th className="p-2 print:p-1.5 border-r border-stone-300">Sektor / Kategori</th>
                  <th className="p-2 print:p-1.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-stone-500">
                      Tidak ada data anggota pada periode yang dipilih.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m, idx) => (
                    <tr key={m.id}>
                      <td className="p-2 print:p-1.5 border-r border-stone-200 text-center">{idx + 1}</td>
                      <td className="p-2 print:p-1.5 border-r border-stone-200 font-mono font-bold break-all">
                        {m.memberNumber}
                      </td>
                      <td className="p-2 print:p-1.5 border-r border-stone-200 font-semibold break-words">
                        {m.fullName}
                      </td>
                      <td className="p-2 print:p-1.5 border-r border-stone-200 break-words">
                        Kel. {m.kelurahan}
                      </td>
                      <td className="p-2 print:p-1.5 border-r border-stone-200 break-words">
                        {m.businessName}
                      </td>
                      <td className="p-2 print:p-1.5 border-r border-stone-200 break-words">
                        {m.category}
                      </td>
                      <td className="p-2 print:p-1.5 text-center font-bold text-teal-700 capitalize">
                        {m.status}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredMembers.length > 0 && (
                <tfoot className="bg-stone-50 font-bold border-t border-stone-300">
                  <tr>
                    <td colSpan={6} className="p-2 print:p-1.5 border-r border-stone-300 text-right">
                      Total Anggota Terdaftar
                    </td>
                    <td className="p-2 print:p-1.5 text-center text-teal-800">
                      {filteredMembers.length} UMKM
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}

          {reportType === 'kelurahan' && (
            <table className="w-full text-left text-xs print:text-[10px] border border-stone-300 tabular-nums">
              <thead className="bg-stone-100 font-bold border-b border-stone-300">
                <tr>
                  <th className="p-2.5 print:p-1.5 border-r border-stone-300 text-center w-10">No.</th>
                  <th className="p-2.5 print:p-1.5 border-r border-stone-300">Nama Kelurahan</th>
                  <th className="p-2.5 print:p-1.5 border-r border-stone-300 text-right">Jumlah UMKM</th>
                  <th className="p-2.5 print:p-1.5 border-r border-stone-300 text-right">Persentase</th>
                  <th className="p-2.5 print:p-1.5 text-center">Status Kemitraan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {KELURAHAN_LIST.map((kel, idx) => {
                  const cnt = filteredMembers.filter((m) => m.kelurahan === kel).length;
                  const pct = ((cnt / (filteredMembers.length || 1)) * 100).toFixed(1);
                  return (
                    <tr key={kel}>
                      <td className="p-2.5 print:p-1.5 border-r border-stone-200 text-center">{idx + 1}</td>
                      <td className="p-2.5 print:p-1.5 border-r border-stone-200 font-bold">Kelurahan {kel}</td>
                      <td className="p-2.5 print:p-1.5 border-r border-stone-200 text-right font-extrabold">{cnt} Pelaku Usaha</td>
                      <td className="p-2.5 print:p-1.5 border-r border-stone-200 text-right">{pct}%</td>
                      <td className="p-2.5 print:p-1.5 text-center text-teal-700 font-semibold">Aktif &amp; Dibina</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-stone-50 font-bold border-t border-stone-300">
                <tr>
                  <td colSpan={2} className="p-2.5 print:p-1.5 border-r border-stone-300 text-right">
                    TOTAL KESELURUHAN (8 KELURAHAN)
                  </td>
                  <td className="p-2.5 print:p-1.5 border-r border-stone-300 text-right text-teal-800">
                    {filteredMembers.length} Pelaku Usaha
                  </td>
                  <td className="p-2.5 print:p-1.5 border-r border-stone-300 text-right">
                    {filteredMembers.length > 0 ? '100.0%' : '0.0%'}
                  </td>
                  <td className="p-2.5 print:p-1.5 text-center">-</td>
                </tr>
              </tfoot>
            </table>
          )}

          {reportType === 'kategori' && (
            <div className="space-y-5">
              {/* Ringkasan Eksekutif Sektor Usaha (terhubung ke form anggota) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-[10px] font-bold uppercase text-stone-500">
                    Total Pelaku UMKM
                  </div>
                  <div className="text-lg font-extrabold text-stone-900 mt-0.5 tabular-nums">
                    {filteredMembers.length} Usaha
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-[10px] font-bold uppercase text-stone-500">
                    Sektor Usaha Terisi
                  </div>
                  <div className="text-lg font-extrabold text-teal-700 mt-0.5 tabular-nums">
                    {sectorDistribution.filter((s) => s.total > 0).length} Sektor
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-[10px] font-bold uppercase text-stone-500">
                    Sektor Dominan
                  </div>
                  <div className="text-sm font-extrabold text-stone-900 mt-1 truncate">
                    {topSector ? `${topSector.category} (${topSector.total})` : 'Belum ada data'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-[10px] font-bold uppercase text-stone-500">
                    Tampil di Direktori
                  </div>
                  <div className="text-lg font-extrabold text-amber-700 mt-0.5 tabular-nums">
                    {filteredMembers.filter((m) => m.isPublicDirectory).length} Usaha
                  </div>
                </div>
              </div>

              <table className="w-full text-left text-xs print:text-[10px] border border-stone-300 tabular-nums">
                <thead className="bg-stone-100 font-bold border-b border-stone-300">
                  <tr>
                    <th className="p-2.5 print:p-1.5 border-r border-stone-300 text-center w-9">No.</th>
                    <th className="p-2.5 print:p-1.5 border-r border-stone-300">Sektor / Kategori Usaha</th>
                    <th className="p-2.5 print:p-1.5 border-r border-stone-300 text-center">Aktif</th>
                    <th className="p-2.5 print:p-1.5 border-r border-stone-300 text-center">Pending</th>
                    <th className="p-2.5 print:p-1.5 border-r border-stone-300 text-center">Direktori</th>
                    <th className="p-2.5 print:p-1.5 border-r border-stone-300 text-right">Jumlah UMKM</th>
                    <th className="p-2.5 print:p-1.5 border-r border-stone-300 text-right">Porsi (%)</th>
                    <th className="p-2.5 print:p-1.5">Contoh Usaha Binaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {sectorDistribution.map((s, idx) => (
                    <tr key={s.category}>
                      <td className="p-2.5 print:p-1.5 border-r border-stone-200 text-center">{idx + 1}</td>
                      <td className="p-2.5 print:p-1.5 border-r border-stone-200 font-bold text-stone-900">
                        {s.category}
                      </td>
                      <td className="p-2.5 print:p-1.5 border-r border-stone-200 text-center text-teal-700 font-semibold">
                        {s.aktif}
                      </td>
                      <td className="p-2.5 print:p-1.5 border-r border-stone-200 text-center text-amber-700 font-semibold">
                        {s.pending}
                      </td>
                      <td className="p-2.5 print:p-1.5 border-r border-stone-200 text-center text-stone-700">
                        {s.publicCount}
                      </td>
                      <td className="p-2.5 print:p-1.5 border-r border-stone-200 text-right font-extrabold text-stone-900">
                        {s.total} UMKM
                      </td>
                      <td className="p-2.5 print:p-1.5 border-r border-stone-200 text-right font-semibold">
                        {s.percentage.toFixed(1)}%
                      </td>
                      <td className="p-2.5 print:p-1.5 text-stone-600 break-words">
                        {s.sampleBusinesses.length > 0
                          ? `${s.sampleBusinesses.join(', ')}${
                              s.total > s.sampleBusinesses.length
                                ? `, +${s.total - s.sampleBusinesses.length} lainnya`
                                : ''
                            }`
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-stone-50 font-bold border-t border-stone-300">
                  <tr>
                    <td colSpan={2} className="p-2.5 print:p-1.5 border-r border-stone-300 text-right">
                      TOTAL DISTRIBUSI SEKTOR
                    </td>
                    <td className="p-2.5 print:p-1.5 border-r border-stone-300 text-center text-teal-800">
                      {filteredMembers.filter((m) => m.status === 'aktif').length}
                    </td>
                    <td className="p-2.5 print:p-1.5 border-r border-stone-300 text-center text-amber-800">
                      {filteredMembers.filter((m) => m.status === 'pending').length}
                    </td>
                    <td className="p-2.5 print:p-1.5 border-r border-stone-300 text-center">
                      {filteredMembers.filter((m) => m.isPublicDirectory).length}
                    </td>
                    <td className="p-2.5 print:p-1.5 border-r border-stone-300 text-right text-teal-800">
                      {filteredMembers.length} UMKM
                    </td>
                    <td className="p-2.5 print:p-1.5 border-r border-stone-300 text-right">
                      {filteredMembers.length > 0 ? '100.0%' : '0.0%'}
                    </td>
                    <td className="p-2.5 print:p-1.5 text-stone-500">
                      Terhubung Form Keanggotaan
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {reportType === 'pertumbuhan' && (
            <div className="space-y-6">
              {/* Ringkasan Statistik Pertumbuhan Anggota */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-[10px] font-bold uppercase text-stone-500">
                    Total Anggota Terdaftar
                  </div>
                  <div className="text-lg font-extrabold text-stone-900 mt-0.5 tabular-nums">
                    {growthReportData.totalAllMembers} Orang
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-[10px] font-bold uppercase text-stone-500">
                    Anggota Berstatus Aktif
                  </div>
                  <div className="text-lg font-extrabold text-teal-700 mt-0.5 tabular-nums">
                    {growthReportData.activeAllMembers} Orang
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-[10px] font-bold uppercase text-stone-500">
                    Pendaftar Tahun {growthReportData.targetYear}
                  </div>
                  <div className="text-lg font-extrabold text-stone-900 mt-0.5 tabular-nums">
                    {growthReportData.newInTargetYear} Anggota
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-[10px] font-bold uppercase text-stone-500">
                    Basis Sebelum {growthReportData.targetYear}
                  </div>
                  <div className="text-lg font-extrabold text-stone-700 mt-0.5 tabular-nums">
                    {growthReportData.baselineBeforeYear} Anggota
                  </div>
                </div>
              </div>

              {/* Tabel 1: Perkembangan Bulanan & Sektor Usaha Masuk */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-800">
                  A. Perkembangan Bulanan Anggota Tahun {growthReportData.targetYear}
                </h4>
                <table className="w-full text-left text-xs print:text-[10px] border border-stone-300 tabular-nums">
                  <thead className="bg-stone-100 font-bold border-b border-stone-300">
                    <tr>
                      <th className="p-2 print:p-1.5 border-r border-stone-300 text-center w-9">No.</th>
                      <th className="p-2 print:p-1.5 border-r border-stone-300">Bulan</th>
                      <th className="p-2 print:p-1.5 border-r border-stone-300 text-center">Pendaftar Baru</th>
                      <th className="p-2 print:p-1.5 border-r border-stone-300 text-center">Aktif / Pending</th>
                      <th className="p-2 print:p-1.5 border-r border-stone-300">Distribusi Sektor Usaha (Form Anggota)</th>
                      <th className="p-2 print:p-1.5 border-r border-stone-300 text-right">Kumulatif</th>
                      <th className="p-2 print:p-1.5 text-right">Pertumbuhan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {growthReportData.visibleMonthlyRows.map((row, idx) => (
                      <tr key={row.monthValue}>
                        <td className="p-2 print:p-1.5 border-r border-stone-200 text-center">{idx + 1}</td>
                        <td className="p-2 print:p-1.5 border-r border-stone-200 font-bold text-stone-900">
                          {row.monthLabel} {growthReportData.targetYear}
                        </td>
                        <td className="p-2 print:p-1.5 border-r border-stone-200 text-center font-extrabold text-teal-700">
                          {row.newCount}
                        </td>
                        <td className="p-2 print:p-1.5 border-r border-stone-200 text-center text-stone-700">
                          {row.activeNew} / {row.pendingNew}
                        </td>
                        <td className="p-2 print:p-1.5 border-r border-stone-200 text-stone-700 break-words">
                          {row.sectorSummary}
                        </td>
                        <td className="p-2 print:p-1.5 border-r border-stone-200 text-right font-bold text-stone-900">
                          {row.cumulativeTotal}
                        </td>
                        <td className="p-2 print:p-1.5 text-right font-semibold text-emerald-700">
                          {row.growthLabel}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tabel 2: Ringkasan Pertumbuhan per Sektor Usaha dari Form Anggota */}
              <div className="space-y-2 print-avoid-break">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-800">
                  B. Komposisi &amp; Pertumbuhan Anggota Berdasarkan Sektor Usaha
                </h4>
                <table className="w-full text-left text-xs print:text-[10px] border border-stone-300 tabular-nums">
                  <thead className="bg-stone-100 font-bold border-b border-stone-300">
                    <tr>
                      <th className="p-2 print:p-1.5 border-r border-stone-300 text-center w-9">No.</th>
                      <th className="p-2 print:p-1.5 border-r border-stone-300">Sektor / Kategori Usaha</th>
                      <th className="p-2 print:p-1.5 border-r border-stone-300 text-center">
                        Penambahan ({periodMonth === 'all' ? growthReportData.targetYear : `${selectedMonthName} ${growthReportData.targetYear}`})
                      </th>
                      <th className="p-2 print:p-1.5 border-r border-stone-300 text-center">Status Aktif</th>
                      <th className="p-2 print:p-1.5 border-r border-stone-300 text-right">Total Keseluruhan</th>
                      <th className="p-2 print:p-1.5 text-right">Kontribusi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {growthReportData.sectorGrowthRows.map((sr, idx) => (
                      <tr key={sr.category}>
                        <td className="p-2 print:p-1.5 border-r border-stone-200 text-center">{idx + 1}</td>
                        <td className="p-2 print:p-1.5 border-r border-stone-200 font-bold text-stone-900">
                          {sr.category}
                        </td>
                        <td className="p-2 print:p-1.5 border-r border-stone-200 text-center font-bold text-teal-700">
                          +{sr.newInPeriod}
                        </td>
                        <td className="p-2 print:p-1.5 border-r border-stone-200 text-center text-stone-700">
                          {sr.activeTotal}
                        </td>
                        <td className="p-2 print:p-1.5 border-r border-stone-200 text-right font-extrabold text-stone-900">
                          {sr.totalAllTime} UMKM
                        </td>
                        <td className="p-2 print:p-1.5 text-right font-semibold">
                          {sr.sharePct.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(reportType === 'keuangan' || reportType === 'buku_kas') && (
            <table className="w-full text-left text-xs print:text-[10px] border border-stone-300 tabular-nums">
              <thead className="bg-stone-100 font-bold border-b border-stone-300">
                <tr>
                  <th className="p-2.5 print:p-1.5 border-r border-stone-300 text-center w-9">No.</th>
                  <th className="p-2.5 print:p-1.5 border-r border-stone-300">No. TRX</th>
                  <th className="p-2.5 print:p-1.5 border-r border-stone-300">Tanggal</th>
                  <th className="p-2.5 print:p-1.5 border-r border-stone-300">Kategori &amp; Uraian</th>
                  <th className="p-2.5 print:p-1.5 border-r border-stone-300 text-right text-teal-700">Masuk (Debit)</th>
                  <th className="p-2.5 print:p-1.5 text-right text-red-600">Keluar (Kredit)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-stone-500">
                      Tidak ada transaksi pada periode yang dipilih.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t, idx) => (
                    <tr key={t.id}>
                      <td className="p-2.5 print:p-1.5 border-r border-stone-200 text-center">{idx + 1}</td>
                      <td className="p-2.5 print:p-1.5 border-r border-stone-200 font-mono font-bold break-all">{t.transactionNumber}</td>
                      <td className="p-2.5 print:p-1.5 border-r border-stone-200">{t.date}</td>
                      <td className="p-2.5 print:p-1.5 border-r border-stone-200 break-words">
                        <strong>{t.category}</strong> - {t.description}
                      </td>
                      <td className="p-2.5 print:p-1.5 border-r border-stone-200 text-right font-bold text-teal-700">
                        {t.type === 'pemasukan' ? formatRupiah(t.amount) : '-'}
                      </td>
                      <td className="p-2.5 print:p-1.5 text-right font-bold text-red-600">
                        {t.type === 'pengeluaran' ? formatRupiah(t.amount) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {reportType === 'iuran' && (
            <table className="w-full text-left text-xs print:text-[10px] border border-stone-300 tabular-nums">
              <thead className="bg-stone-100 font-bold border-b border-stone-300">
                <tr>
                  <th className="p-2.5 print:p-1.5 border-r border-stone-300 text-center w-9">No.</th>
                  <th className="p-2.5 print:p-1.5 border-r border-stone-300">Tanggal</th>
                  <th className="p-2.5 print:p-1.5 border-r border-stone-300">Uraian Penerimaan Iuran</th>
                  <th className="p-2.5 print:p-1.5 border-r border-stone-300 text-right">Nominal</th>
                  <th className="p-2.5 print:p-1.5 text-center">Petugas Penerima</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredTransactions.filter((t) => t.category === 'Iuran Anggota').length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-stone-500">
                      Tidak ada penerimaan iuran anggota pada periode yang dipilih.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions
                    .filter((t) => t.category === 'Iuran Anggota')
                    .map((t, idx) => (
                      <tr key={t.id}>
                        <td className="p-2.5 print:p-1.5 border-r border-stone-200 text-center">{idx + 1}</td>
                        <td className="p-2.5 print:p-1.5 border-r border-stone-200">{t.date}</td>
                        <td className="p-2.5 print:p-1.5 border-r border-stone-200 font-medium break-words">
                          {t.memberName ? `${t.memberName} — ` : ''}
                          {t.description}
                        </td>
                        <td className="p-2.5 print:p-1.5 border-r border-stone-200 text-right font-bold text-teal-700">
                          {formatRupiah(t.amount)}
                        </td>
                        <td className="p-2.5 print:p-1.5 text-center">{t.recorderName}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          )}

          {reportType === 'kegiatan' && (
            <table className="w-full text-left text-xs print:text-[10px] border border-stone-300 tabular-nums">
              <thead className="bg-stone-100 font-bold border-b border-stone-300">
                <tr>
                  <th className="p-2.5 print:p-1.5 border-r border-stone-300 text-center w-9">No.</th>
                  <th className="p-2.5 print:p-1.5 border-r border-stone-300">Nama Agenda Kegiatan</th>
                  <th className="p-2.5 print:p-1.5 border-r border-stone-300">Waktu &amp; Tanggal</th>
                  <th className="p-2.5 print:p-1.5 border-r border-stone-300">Lokasi Penyelenggaraan</th>
                  <th className="p-2.5 print:p-1.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-stone-500">
                      Tidak ada agenda kegiatan pada periode yang dipilih.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((e, idx) => (
                    <tr key={e.id}>
                      <td className="p-2.5 print:p-1.5 border-r border-stone-200 text-center">{idx + 1}</td>
                      <td className="p-2.5 print:p-1.5 border-r border-stone-200 font-bold break-words">{e.title}</td>
                      <td className="p-2.5 print:p-1.5 border-r border-stone-200">{e.date} &bull; {e.time}</td>
                      <td className="p-2.5 print:p-1.5 border-r border-stone-200 break-words">{e.location}</td>
                      <td className="p-2.5 print:p-1.5 text-center font-bold text-amber-700 capitalize">{e.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Signature & Validation Footer for Printed Formal Report */}
        <div className="pt-8 grid grid-cols-2 text-center text-xs print-avoid-break">
          <div className="space-y-16">
            <div>
              <span>Mengetahui,</span>
              <div className="font-bold">Ketua Forum UMKM KUAT</div>
            </div>
            <div className="font-bold underline">Emus Muslihant</div>
          </div>

          <div className="space-y-16">
            <div>
              <span>
                Kota Tangerang,{' '}
                {new Date().toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <div className="font-bold">Bendahara Forum</div>
            </div>
            <div className="font-bold underline">Peni Martin</div>
          </div>
        </div>
      </div>
    </div>
  );
};
