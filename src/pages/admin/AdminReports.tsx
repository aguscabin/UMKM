import React, { useState, useMemo } from 'react';
import { Member, Transaction, ForumEvent, KELURAHAN_LIST } from '../../types';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Filter,
  Users,
  Wallet,
  Building2,
  PieChart,
  CheckCircle2,
} from 'lucide-react';
import { UmkmKuatLogo } from '../../components/UmkmKuatLogo';

interface AdminReportsProps {
  members: Member[];
  transactions: Transaction[];
  events: ForumEvent[];
}

export const AdminReports: React.FC<AdminReportsProps> = ({
  members,
  transactions,
  events,
}) => {
  const [reportType, setReportType] = useState<
    'keanggotaan' | 'kelurahan' | 'kategori' | 'pertumbuhan' | 'keuangan' | 'buku_kas' | 'iuran' | 'kegiatan'
  >('keanggotaan');

  const [periodYear, setPeriodYear] = useState('2026');
  const [periodMonth, setPeriodMonth] = useState('all');

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

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `Laporan_${reportType}_${periodYear}.csv`;

    if (reportType === 'keanggotaan') {
      headers = ['No. Anggota', 'Nama Lengkap', 'Kelurahan', 'Usaha', 'Kategori', 'Status', 'Tgl Gabung'];
      rows = members.map((m) => [m.memberNumber, m.fullName, m.kelurahan, m.businessName, m.category, m.status, m.joinDate]);
    } else if (reportType === 'kelurahan') {
      headers = ['Kelurahan', 'Jumlah UMKM', 'Status Wilayah'];
      rows = KELURAHAN_LIST.map((k) => [
        k,
        members.filter((m) => m.kelurahan === k).length,
        'Terdaftar Aktif',
      ]);
    } else if (reportType === 'keuangan' || reportType === 'buku_kas') {
      headers = ['No. Transaksi', 'Tanggal', 'Tipe', 'Kategori', 'Uraian', 'Nominal', 'Status'];
      rows = transactions.map((t) => [t.transactionNumber, t.date, t.type, t.category, t.description, t.amount, t.approvalStatus]);
    } else if (reportType === 'iuran') {
      headers = ['No. Transaksi', 'Tanggal', 'Uraian', 'Nominal', 'Pencatat'];
      rows = transactions.filter((t) => t.category === 'Iuran Anggota').map((t) => [t.transactionNumber, t.date, t.description, t.amount, t.recorderName]);
    } else if (reportType === 'kegiatan') {
      headers = ['Nama Kegiatan', 'Tanggal', 'Waktu', 'Lokasi', 'Penyelenggara', 'Status'];
      rows = events.map((e) => [e.title, e.date, e.time, e.location, e.organizer, e.status]);
    } else {
      headers = ['Item', 'Jumlah'];
      rows = [['Total UMKM', members.length]];
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Laporan Eksekutif & Statistik
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Rekapitulasi data keanggotaan, sebaran kelurahan, dan arus kas keuangan siap cetak.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-teal-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen Resmi</span>
          </button>
        </div>
      </div>

      {/* Selectors */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Jenis Laporan
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800"
          >
            <option value="keanggotaan">1. Laporan Keanggotaan Lengkap</option>
            <option value="kelurahan">2. Laporan Anggota per Kelurahan</option>
            <option value="kategori">3. Laporan Kategori Usaha</option>
            <option value="pertumbuhan">4. Laporan Pertumbuhan Anggota</option>
            <option value="keuangan">5. Laporan Keuangan (Arus Kas)</option>
            <option value="buku_kas">6. Laporan Buku Kas Umum</option>
            <option value="iuran">7. Rekap Iuran Anggota</option>
            <option value="kegiatan">8. Laporan Agenda & Kegiatan</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Tahun Laporan
          </label>
          <select
            value={periodYear}
            onChange={(e) => setPeriodYear(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium"
          >
            <option value="2026">Tahun 2026</option>
            <option value="2025">Tahun 2025</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Bulan
          </label>
          <select
            value={periodMonth}
            onChange={(e) => setPeriodMonth(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium"
          >
            <option value="all">Semua Bulan (Tahunan)</option>
            <option value="01">Januari</option>
            <option value="02">Februari</option>
            <option value="03">Maret</option>
            <option value="04">April</option>
          </select>
        </div>
      </div>

      {/* DOCUMENT PREVIEW BOX (PRINTABLE VIEW WITH LETTERHEAD) */}
      <div className="bg-white rounded-3xl border border-slate-300 shadow-md p-8 sm:p-12 space-y-8 print:p-0 print:border-none print:shadow-none">
        {/* Official Letterhead (Kop Surat) */}
        <div className="border-b-4 border-double border-slate-900 pb-6 text-center space-y-2 relative">
          <div className="flex items-center justify-center gap-4">
            <UmkmKuatLogo size="lg" variant="icon" theme="dark" />
            <div className="text-center">
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900">
                Pemerintah Kota Tangerang &bull; Kecamatan Tangerang
              </h2>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                FORUM UMKM KUAT KECAMATAN TANGERANG
              </h1>
              <p className="text-xs text-slate-600 max-w-xl mx-auto">
                Sekretariat: Gedung Kantor Kecamatan Tangerang, Jl. Daan Mogot No. 5, Kota Tangerang. Telp/WA: 085880942565 | Email: umkmkectangerang@gmail.com
              </p>
            </div>
          </div>
        </div>

        {/* Report Document Title */}
        <div className="text-center space-y-1">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase underline decoration-2 underline-offset-4">
            {reportType === 'keanggotaan' && 'LAPORAN REKAPITULASI KEANGGOTAAN UMKM'}
            {reportType === 'kelurahan' && 'LAPORAN SEBARAN PELAKU USAHA PER KELURAHAN'}
            {reportType === 'kategori' && 'LAPORAN DISTRIBUSI SEKTOR KATEGORI USAHA'}
            {reportType === 'pertumbuhan' && 'LAPORAN PERKEMBANGAN & PERTUMBUHAN ANGGOTA'}
            {reportType === 'keuangan' && 'LAPORAN KEUANGAN ARUS KAS MASUK & KELUAR'}
            {reportType === 'buku_kas' && 'BUKU KAS UMUM (BKU) FORUM UMKM KUAT'}
            {reportType === 'iuran' && 'REKAPITULASI PENERIMAAN IURAN ANGGOTA'}
            {reportType === 'kegiatan' && 'LAPORAN AGENDA BAZAR & PELATIHAN KEWIRAUSAHAAN'}
          </h3>
          <p className="text-xs font-semibold text-slate-500">
            Periode: {periodMonth === 'all' ? 'Tahun ' + periodYear : `Bulan ${periodMonth} - Tahun ${periodYear}`}
          </p>
        </div>

        {/* Report Content Table */}
        <div className="overflow-x-auto">
          {reportType === 'keanggotaan' && (
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300">No.</th>
                  <th className="p-2 border-r border-slate-300">No. Anggota</th>
                  <th className="p-2 border-r border-slate-300">Nama Lengkap</th>
                  <th className="p-2 border-r border-slate-300">Kelurahan</th>
                  <th className="p-2 border-r border-slate-300">Nama Usaha</th>
                  <th className="p-2 border-r border-slate-300">Kategori</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {members.map((m, idx) => (
                  <tr key={m.id}>
                    <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-200 font-mono font-bold">{m.memberNumber}</td>
                    <td className="p-2 border-r border-slate-200 font-semibold">{m.fullName}</td>
                    <td className="p-2 border-r border-slate-200">Kel. {m.kelurahan}</td>
                    <td className="p-2 border-r border-slate-200">{m.businessName}</td>
                    <td className="p-2 border-r border-slate-200">{m.category}</td>
                    <td className="p-2 text-center font-bold text-teal-700 capitalize">{m.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'kelurahan' && (
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300">No.</th>
                  <th className="p-2 border-r border-slate-300">Nama Kelurahan</th>
                  <th className="p-2 border-r border-slate-300 text-right">Jumlah UMKM</th>
                  <th className="p-2 border-r border-slate-300 text-right">Persentase</th>
                  <th className="p-2 text-center">Status Kemitraan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {KELURAHAN_LIST.map((kel, idx) => {
                  const cnt = members.filter((m) => m.kelurahan === kel).length;
                  const pct = ((cnt / (members.length || 1)) * 100).toFixed(1);
                  return (
                    <tr key={kel}>
                      <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-bold">Kelurahan {kel}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-black">{cnt} Pelaku Usaha</td>
                      <td className="p-2 border-r border-slate-200 text-right">{pct}%</td>
                      <td className="p-2 text-center text-teal-700 font-semibold">Aktif & Dibina</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {(reportType === 'keuangan' || reportType === 'buku_kas') && (
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300">No.</th>
                  <th className="p-2 border-r border-slate-300">No. TRX</th>
                  <th className="p-2 border-r border-slate-300">Tanggal</th>
                  <th className="p-2 border-r border-slate-300">Kategori & Uraian</th>
                  <th className="p-2 border-r border-slate-300 text-right text-teal-700">Masuk (Debit)</th>
                  <th className="p-2 text-right text-red-600">Keluar (Kredit)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {transactions.map((t, idx) => (
                  <tr key={t.id}>
                    <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-200 font-mono font-bold">{t.transactionNumber}</td>
                    <td className="p-2 border-r border-slate-200">{t.date}</td>
                    <td className="p-2 border-r border-slate-200">
                      <strong>{t.category}</strong> - {t.description}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-bold text-teal-700">
                      {t.type === 'pemasukan' ? formatRupiah(t.amount) : '-'}
                    </td>
                    <td className="p-2 text-right font-bold text-red-600">
                      {t.type === 'pengeluaran' ? formatRupiah(t.amount) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'iuran' && (
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300">No.</th>
                  <th className="p-2 border-r border-slate-300">Tanggal</th>
                  <th className="p-2 border-r border-slate-300">Uraian Penerimaan Iuran</th>
                  <th className="p-2 border-r border-slate-300 text-right">Nominal</th>
                  <th className="p-2 text-center">Petugas Penerima</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {transactions
                  .filter((t) => t.category === 'Iuran Anggota')
                  .map((t, idx) => (
                    <tr key={t.id}>
                      <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200">{t.date}</td>
                      <td className="p-2 border-r border-slate-200 font-medium">{t.description}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-bold text-teal-700">
                        {formatRupiah(t.amount)}
                      </td>
                      <td className="p-2 text-center">{t.recorderName}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {reportType === 'kegiatan' && (
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300">No.</th>
                  <th className="p-2 border-r border-slate-300">Nama Agenda Kegiatan</th>
                  <th className="p-2 border-r border-slate-300">Waktu & Tanggal</th>
                  <th className="p-2 border-r border-slate-300">Lokasi Penyelenggaraan</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {events.map((e, idx) => (
                  <tr key={e.id}>
                    <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-200 font-bold">{e.title}</td>
                    <td className="p-2 border-r border-slate-200">{e.date} &bull; {e.time}</td>
                    <td className="p-2 border-r border-slate-200">{e.location}</td>
                    <td className="p-2 text-center font-bold text-orange-600 capitalize">{e.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Signature & Validation Footer for Printed Formal Report */}
        <div className="pt-8 grid grid-cols-2 text-center text-xs">
          <div className="space-y-16">
            <div>
              <span>Mengetahui,</span>
              <div className="font-bold">Ketua Forum UMKM KUAT</div>
            </div>
            <div className="font-bold underline">Emus Muslihant</div>
          </div>

          <div className="space-y-16">
            <div>
              <span>Kota Tangerang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <div className="font-bold">Bendahara Forum</div>
            </div>
            <div className="font-bold underline">Peni Martin</div>
          </div>
        </div>
      </div>
    </div>
  );
};
