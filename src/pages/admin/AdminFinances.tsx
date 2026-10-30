import React, { useState, useMemo, useRef } from 'react';
import { Transaction, TransactionType } from '../../types';
import { dbService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { OFFICIAL_LOGO_URL } from '../../components/UmkmKuatLogo';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Paperclip,
  Check,
  X,
  AlertCircle,
  History,
  Upload,
  Image as ImageIcon,
  Camera,
  Trash2,
} from 'lucide-react';

interface AdminFinancesProps {
  transactions: Transaction[];
  onRefresh: () => void;
  openAddModalInitially?: boolean;
}

export const AdminFinances: React.FC<AdminFinancesProps> = ({
  transactions,
  onRefresh,
  openAddModalInitially = false,
}) => {
  const { profile, canManageFinances } = useAuth();
  const [activeTab, setActiveTab] = useState<'buku_kas' | 'pemasukan' | 'pengeluaran' | 'rekap_iuran'>('buku_kas');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [modalOpen, setModalOpen] = useState(openAddModalInitially);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // File input ref for proof upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const initialForm: Omit<Transaction, 'id'> = {
    transactionNumber: '',
    type: 'pemasukan',
    category: 'Iuran Anggota',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    description: '',
    recorderName: profile?.displayName || 'Bendahara Forum',
    recorderId: profile?.uid || 'usr-bendahara',
    approvalStatus: 'disetujui',
    approvedBy: profile?.displayName || 'Ketua Forum UMKM KUAT',
    proofUrl: '',
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const [formData, setFormData] = useState<Omit<Transaction, 'id'>>(initialForm);

  // Generate next transaction number
  const generateTrxNumber = () => {
    const year = new Date().getFullYear();
    const count = transactions.length + 1;
    return `TRX-${year}-${String(count).padStart(3, '0')}`;
  };

  const handleOpenAdd = (type: TransactionType = 'pemasukan') => {
    setFormData({
      ...initialForm,
      type,
      category: type === 'pemasukan' ? 'Iuran Anggota' : 'Operasional Sekretariat',
      transactionNumber: generateTrxNumber(),
    });
    setModalOpen(true);
  };

  // Image Upload handler (Screenshots, direct camera photos, gallery)
  const handleProofImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar (JPG, PNG, WEBP, tangkapan layar)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        proofUrl: base64,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) {
      alert('Nominal transaksi harus lebih dari 0');
      return;
    }

    const id = 'trx-' + Date.now();
    const newTx: Transaction = {
      id,
      ...formData,
      history: [
        {
          timestamp: new Date().toISOString(),
          action: 'Pencatatan Awal Transaksi',
          userName: profile?.displayName || 'Bendahara',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dbService.saveTransaction(newTx);
    await dbService.addLog({
      userId: profile?.uid || 'usr-bendahara',
      userName: profile?.displayName || 'Bendahara',
      action: 'Catat Transaksi Keuangan',
      target: newTx.transactionNumber,
      details: `${newTx.type.toUpperCase()}: ${newTx.category} - Rp ${newTx.amount.toLocaleString('id-ID')} (${newTx.description})`,
    });

    setModalOpen(false);
    onRefresh();
  };

  // Calculations
  const totalPemasukan = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'pemasukan' && t.approvalStatus === 'disetujui')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [transactions]);

  const totalPengeluaran = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'pengeluaran' && t.approvalStatus === 'disetujui')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [transactions]);

  const saldoKas = totalPemasukan - totalPengeluaran;

  const totalIuran = useMemo(() => {
    return transactions
      .filter((t) => t.category === 'Iuran Anggota' && t.approvalStatus === 'disetujui')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [transactions]);

  // Chronological running balance for Buku Kas Umum
  const runningCashBook = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let current = 0;
    const withRunning = sorted.map((t) => {
      if (t.approvalStatus === 'disetujui') {
        if (t.type === 'pemasukan') current += Number(t.amount);
        else current -= Number(t.amount);
      }
      return { ...t, runningBalance: current };
    });
    return withRunning.reverse();
  }, [transactions]);

  // Filtered transactions based on tab and inputs
  const displayedTransactions = useMemo(() => {
    return runningCashBook.filter((t) => {
      if (activeTab === 'pemasukan' && t.type !== 'pemasukan') return false;
      if (activeTab === 'pengeluaran' && t.type !== 'pengeluaran') return false;
      if (activeTab === 'rekap_iuran' && t.category !== 'Iuran Anggota') return false;

      const matchSearch =
        search === '' ||
        t.transactionNumber.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());

      const matchCategory = filterCategory === 'all' || t.category === filterCategory;

      return matchSearch && matchCategory;
    });
  }, [runningCashBook, activeTab, search, filterCategory]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleExportCSV = () => {
    const headers = ['No. Transaksi', 'Tanggal', 'Tipe', 'Kategori', 'Uraian', 'Pemasukan', 'Pengeluaran', 'Pencatat', 'Status'];
    const rows = displayedTransactions.map((t) => [
      `"${t.transactionNumber}"`,
      `"${t.date}"`,
      `"${t.type}"`,
      `"${t.category}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.type === 'pemasukan' ? t.amount : 0,
      t.type === 'pengeluaran' ? t.amount : 0,
      `"${t.recorderName}"`,
      `"${t.approvalStatus}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Buku_Kas_UMKM_KUAT_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerPrintDocument = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Buku Kas & Manajemen Keuangan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Pencatatan kas internal, iuran anggota, donasi, bantuan pemerintah, dan pengeluaran kegiatan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-teal-600" />
            <span>Ekspor Buku Kas</span>
          </button>

          <button
            onClick={() => setPrintModalOpen(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-teal-600" />
            <span>Cetak PDF Resmi</span>
          </button>

          {canManageFinances && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleOpenAdd('pemasukan')}
                className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Pemasukan</span>
              </button>
              <button
                onClick={() => handleOpenAdd('pengeluaran')}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Pengeluaran</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4 Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Akhir */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 border border-slate-700 shadow-md space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
            Saldo Kas Berjalan
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {formatRupiah(saldoKas)}
          </div>
          <div className="text-[10px] text-slate-400 pt-1">
            Dihitung otomatis dari seluruh transaksi disetujui
          </div>
        </div>

        {/* Total Pemasukan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Pemasukan
            </span>
            <div className="h-7 w-7 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-600">
            {formatRupiah(totalPemasukan)}
          </div>
          <div className="text-[10px] text-slate-400">
            Iuran, bantuan, donasi, sponsorship
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Pengeluaran
            </span>
            <div className="h-7 w-7 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-500">
            {formatRupiah(totalPengeluaran)}
          </div>
          <div className="text-[10px] text-slate-400">
            Operasional, sewa bazar, narasumber
          </div>
        </div>

        {/* Rekap Iuran */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Penerimaan Iuran
            </span>
            <div className="h-7 w-7 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-orange-600">
            {formatRupiah(totalIuran)}
          </div>
          <div className="text-[10px] text-slate-400">
            Kontribusi iuran rutin bulanan anggota
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('buku_kas')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'buku_kas'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Buku Kas Umum (Semua)
        </button>
        <button
          onClick={() => setActiveTab('pemasukan')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'pemasukan'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Pemasukan Kas
        </button>
        <button
          onClick={() => setActiveTab('pengeluaran')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'pengeluaran'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Pengeluaran Kas
        </button>
        <button
          onClick={() => setActiveTab('rekap_iuran')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'rekap_iuran'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Rekap Iuran Anggota
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari uraian atau nomor transaksi..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-700 font-medium"
          >
            <option value="all">Semua Kategori</option>
            <option value="Iuran Anggota">Iuran Anggota</option>
            <option value="Bantuan & Hibah">Bantuan & Hibah</option>
            <option value="Sponsor & Donasi">Sponsor & Donasi</option>
            <option value="Operasional Sekretariat">Operasional Sekretariat</option>
            <option value="Kegiatan & Bazar">Kegiatan & Bazar</option>
            <option value="Pelatihan & Pembinaan">Pelatihan & Pembinaan</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">No. Transaksi</th>
                <th className="px-4 py-3.5">Tanggal</th>
                <th className="px-4 py-3.5">Kategori & Uraian</th>
                <th className="px-4 py-3.5 text-right text-teal-700">Masuk (Debit)</th>
                <th className="px-4 py-3.5 text-right text-red-600">Keluar (Kredit)</th>
                <th className="px-4 py-3.5 text-right font-black">Saldo</th>
                <th className="px-4 py-3.5 text-center">Bukti Nota</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2.5">
                      <div className="h-12 w-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <div className="font-bold text-slate-800 text-sm">Belum Ada Catatan Kas</div>
                      <p className="text-xs text-slate-500">
                        {transactions.length === 0
                          ? 'Buku kas masih kosong dengan saldo Rp 0. Silakan catat transaksi kas atau iuran pertama.'
                          : 'Tidak ada catatan transaksi yang sesuai filter.'}
                      </p>
                      {transactions.length === 0 && (
                        <div className="pt-2">
                          <button
                            onClick={() => handleOpenAdd()}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Catat Transaksi Pertama</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                displayedTransactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {tx.transactionNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{tx.date}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800">{tx.category}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{tx.description}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-teal-600 whitespace-nowrap">
                      {tx.type === 'pemasukan' ? formatRupiah(tx.amount) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-500 whitespace-nowrap">
                      {tx.type === 'pengeluaran' ? formatRupiah(tx.amount) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatRupiah(tx.runningBalance)}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {tx.proofUrl ? (
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="inline-flex items-center gap-1 text-[11px] bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded border border-teal-200 hover:bg-teal-100 cursor-pointer"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>Ada Bukti</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="text-xs text-teal-700 hover:text-teal-900 font-bold hover:underline cursor-pointer"
                      >
                        Lihat Rincian
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CATAT TRANSAKSI DENGAN UPLOAD BUKTI TRANSFER LANGSUNG */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-black text-slate-900 text-lg">
                  Catat Transaksi Kas Baru
                </h3>
                <span className="text-xs font-mono font-bold text-teal-700">
                  {formData.transactionNumber}
                </span>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Transaksi <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const t = e.target.value as TransactionType;
                      setFormData({
                        ...formData,
                        type: t,
                        category: t === 'pemasukan' ? 'Iuran Anggota' : 'Operasional Sekretariat',
                      });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  >
                    <option value="pemasukan">Pemasukan (Debit)</option>
                    <option value="pengeluaran">Pengeluaran (Kredit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Transaksi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium"
                  >
                    {formData.type === 'pemasukan' ? (
                      <>
                        <option value="Iuran Anggota">Iuran Anggota</option>
                        <option value="Bantuan & Hibah">Bantuan & Hibah</option>
                        <option value="Sponsor & Donasi">Sponsor & Donasi</option>
                        <option value="Pendapatan Bazar / Acara">Pendapatan Bazar / Acara</option>
                        <option value="Lainnya">Lainnya</option>
                      </>
                    ) : (
                      <>
                        <option value="Operasional Sekretariat">Operasional Sekretariat</option>
                        <option value="Kegiatan & Bazar">Kegiatan & Bazar</option>
                        <option value="Pelatihan & Pembinaan">Pelatihan & Pembinaan</option>
                        <option value="Konsumsi & Rapat">Konsumsi & Rapat</option>
                        <option value="Pengadaan & Sarana">Pengadaan & Sarana</option>
                        <option value="Lainnya">Lainnya</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nominal (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    placeholder="Contoh: 500000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Uraian Keterangan Transaksi <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Penjelasan rinci peruntukan dana atau sumber penerimaan..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              {/* UPLOAD BUKTI TRANSFER / NOTA LANGSUNG (GAMBAR / FOTO / SCREENSHOT) */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-800">
                  Bukti Transfer / Nota / Tangkapan Layar
                </label>

                {formData.proofUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-teal-400 bg-slate-50 p-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={formData.proofUrl}
                        alt="Bukti Transfer"
                        className="h-16 w-16 object-cover rounded-xl border border-slate-300"
                      />
                      <div>
                        <div className="text-xs font-bold text-teal-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                          <span>Bukti Gambar Terlampir</span>
                        </div>
                        <span className="text-[11px] text-slate-400">Siap disimpan bersama transaksi</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, proofUrl: '' })}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl cursor-pointer"
                      title="Hapus Bukti"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/40 hover:bg-teal-50/70 p-4 rounded-2xl text-center cursor-pointer transition-colors"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleProofImageUpload}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <div className="h-10 w-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
                          <Camera className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-bold text-teal-800">
                          Klik untuk Upload Foto / Tangkapan Layar (Screenshot) Bukti Transfer
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Mendukung kamera HP langsung, file JPG, PNG, atau screenshot m-Banking
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>atau masukkan URL gambar eksternal jika ada:</span>
                    </div>
                    <input
                      type="url"
                      value={formData.proofUrl}
                      onChange={(e) => setFormData({ ...formData, proofUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Simpan Transaksi Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL TRANSAKSI & PREVIEW BUKTI GAMBAR */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-mono font-bold text-teal-700 text-xs">
                {selectedTx.transactionNumber}
              </span>
              <button onClick={() => setSelectedTx(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="text-center py-2 space-y-1">
                <span className="text-xs uppercase font-bold text-slate-400">
                  {selectedTx.type.toUpperCase()} &bull; {selectedTx.category}
                </span>
                <div
                  className={`text-2xl font-black ${
                    selectedTx.type === 'pemasukan' ? 'text-teal-600' : 'text-red-500'
                  }`}
                >
                  {selectedTx.type === 'pemasukan' ? '+' : '-'} {formatRupiah(selectedTx.amount)}
                </div>
                <div className="text-xs text-slate-500">{selectedTx.date}</div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <div>
                  <span className="text-slate-400 font-semibold">Uraian:</span>
                  <div className="font-semibold text-slate-800">{selectedTx.description}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Pencatat / Pemohon:</span>
                  <div className="text-slate-700">{selectedTx.recorderName}</div>
                </div>
                {selectedTx.approvedBy && (
                  <div>
                    <span className="text-slate-400 font-semibold">Disetujui Oleh:</span>
                    <div className="text-slate-700 font-medium">{selectedTx.approvedBy}</div>
                  </div>
                )}
              </div>

              {selectedTx.proofUrl ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Lampiran Bukti Nota / Transfer:</span>
                    <a
                      href={selectedTx.proofUrl}
                      download={`Bukti_${selectedTx.transactionNumber}.png`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-600 hover:underline"
                    >
                      Buka Gambar Asli
                    </a>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-slate-200 max-h-72 bg-slate-100 flex items-center justify-center">
                    <img
                      src={selectedTx.proofUrl}
                      alt="Bukti Transaksi"
                      className="w-full h-auto max-h-72 object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 bg-slate-50 rounded-xl text-xs text-slate-400">
                  Tidak ada lampiran bukti nota pada transaksi ini.
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedTx(null)}
                className="bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED MODAL CETAK PDF RESMI BUKU KAS UMUM */}
      {printModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-teal-400" />
                <span className="font-bold text-sm">Pratinjau Cetak PDF Buku Kas Umum</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={triggerPrintDocument}
                  className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Simpan PDF Sekarang</span>
                </button>
                <button
                  onClick={() => setPrintModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content with Kop Surat */}
            <div className="p-8 sm:p-12 overflow-y-auto space-y-6 print:p-0">
              {/* Official Kop Surat */}
              <div className="border-b-4 border-double border-slate-900 pb-4 text-center relative flex items-center justify-center gap-4">
                <img
                  src={OFFICIAL_LOGO_URL}
                  alt="Logo UMKM KUAT"
                  className="w-20 h-20 rounded-full border border-slate-300 object-cover"
                />
                <div>
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-800">
                    Pemerintah Kota Tangerang &bull; Kecamatan Tangerang
                  </h3>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    FORUM UMKM KUAT KECAMATAN TANGERANG
                  </h1>
                  <p className="text-[11px] text-slate-600">
                    Sekretariat: Gedung Kantor Kecamatan Tangerang, Jl. Daan Mogot No. 5, Kota Tangerang. Telp: (021) 5523456 / WA 0812-8923-4111
                  </p>
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-1">
                <h2 className="text-lg font-black text-slate-900 uppercase underline decoration-2 underline-offset-4">
                  BUKU KAS UMUM (BKU) FORUM UMKM KUAT
                </h2>
                <div className="text-xs text-slate-500 font-semibold">
                  Tahun Buku 2026 &bull; Dicetak pada:{' '}
                  {new Date().toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-300 text-xs">
                <div>
                  <span className="text-slate-500">Total Pemasukan (Debit):</span>
                  <div className="text-sm font-black text-teal-700">{formatRupiah(totalPemasukan)}</div>
                </div>
                <div>
                  <span className="text-slate-500">Total Pengeluaran (Kredit):</span>
                  <div className="text-sm font-black text-red-600">{formatRupiah(totalPengeluaran)}</div>
                </div>
                <div>
                  <span className="text-slate-500">Saldo Akhir Berjalan:</span>
                  <div className="text-sm font-black text-slate-900">{formatRupiah(saldoKas)}</div>
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-left text-[11px] border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300">No.</th>
                    <th className="p-2 border-r border-slate-300">No. Bukti</th>
                    <th className="p-2 border-r border-slate-300">Tanggal</th>
                    <th className="p-2 border-r border-slate-300">Kategori & Uraian</th>
                    <th className="p-2 border-r border-slate-300 text-right">Debit (Rp)</th>
                    <th className="p-2 border-r border-slate-300 text-right">Kredit (Rp)</th>
                    <th className="p-2 text-right">Saldo (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {runningCashBook.map((tx: any, idx) => (
                    <tr key={tx.id}>
                      <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-mono font-bold">{tx.transactionNumber}</td>
                      <td className="p-2 border-r border-slate-200 whitespace-nowrap">{tx.date}</td>
                      <td className="p-2 border-r border-slate-200">
                        <strong>{tx.category}</strong> &bull; {tx.description}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-bold text-teal-700">
                        {tx.type === 'pemasukan' ? Number(tx.amount).toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-bold text-red-600">
                        {tx.type === 'pengeluaran' ? Number(tx.amount).toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-slate-900">
                        {Number(tx.runningBalance).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures */}
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

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setPrintModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={triggerPrintDocument}
                className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Cetak ke PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
