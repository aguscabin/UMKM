import React, { useState, useMemo, useRef } from 'react';
import { Member, Transaction, TransactionType } from '../../types';
import { dbService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { OFFICIAL_LOGO_URL } from '../../components/UmkmKuatLogo';
import { compressImage } from '../../utils/image';
import { validateTransactionInput, validateUploadedFile } from '../../utils/validation';
import {
  MONTH_OPTIONS,
  getMonthLabel,
  getAvailableYears,
  filterDuesTransactions,
  resolveTransactionMember,
  buildMemberDuesSummary,
  exportDuesExcel,
  exportDuesOfficialPdf,
} from '../../utils/duesReport';
import { InlineShimmer } from '../../components/common/Skeleton';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
  Download,
  Printer,
  CheckCircle2,
  Paperclip,
  X,
  Camera,
  Trash2,
  User,
  FileSpreadsheet,
  FileText,
  Calendar,
  Users,
} from 'lucide-react';

interface AdminFinancesProps {
  transactions: Transaction[];
  members?: Member[];
  onRefresh: () => void;
  openAddModalInitially?: boolean;
}

export const AdminFinances: React.FC<AdminFinancesProps> = ({
  transactions,
  members = [],
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

  // Member selector search state inside Catat Transaksi modal
  const [memberPickerSearch, setMemberPickerSearch] = useState('');

  // Rekap Iuran Anggota state (Pilihan Bulan & Tahun + Export)
  const nowDate = new Date();
  const [duesMonth, setDuesMonth] = useState<string>(String(nowDate.getMonth() + 1).padStart(2, '0'));
  const [duesYear, setDuesYear] = useState<string>(String(nowDate.getFullYear()));
  const [duesSearch, setDuesSearch] = useState('');
  const [duesViewMode, setDuesViewMode] = useState<'transaksi' | 'status_anggota'>('transaksi');
  const [isExportingDuesPdf, setIsExportingDuesPdf] = useState(false);
  const [duesPrintModalOpen, setDuesPrintModalOpen] = useState(false);

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
    memberId: '',
    memberName: '',
    memberNumber: '',
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

  const formatPeriodFromDate = (isoDate: string) => {
    const m = isoDate.slice(5, 7);
    const y = isoDate.slice(0, 4);
    const label = MONTH_OPTIONS.find((opt) => opt.value === m)?.label;
    return label && y ? `${label} ${y}` : isoDate;
  };

  const handleOpenAdd = (type: TransactionType = 'pemasukan', presetCategory?: string) => {
    setMemberPickerSearch('');
    setFormData({
      ...initialForm,
      type,
      category: presetCategory || (type === 'pemasukan' ? 'Iuran Anggota' : 'Operasional Sekretariat'),
      transactionNumber: generateTrxNumber(),
      memberId: '',
      memberName: '',
      memberNumber: '',
    });
    setModalOpen(true);
  };

  const handleOpenAddForMember = (member: Member) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetMonth = duesMonth !== 'all' ? duesMonth : todayStr.slice(5, 7);
    const targetYear = duesYear !== 'all' ? duesYear : todayStr.slice(0, 4);
    const txDate =
      duesMonth !== 'all' && duesYear !== 'all'
        ? `${targetYear}-${targetMonth}-01`
        : todayStr;
    const periodLabel = `${getMonthLabel(targetMonth)} ${targetYear}`;

    setMemberPickerSearch('');
    setFormData({
      ...initialForm,
      type: 'pemasukan',
      category: 'Iuran Anggota',
      date: txDate,
      transactionNumber: generateTrxNumber(),
      memberId: member.id,
      memberName: member.fullName,
      memberNumber: member.memberNumber,
      description: `Iuran Anggota (${periodLabel}) - ${member.fullName} (${member.businessName})`,
    });
    setModalOpen(true);
  };

  const handleSelectMemberInForm = (selectedId: string) => {
    if (!selectedId) {
      setFormData((prev) => ({
        ...prev,
        memberId: '',
        memberName: '',
        memberNumber: '',
      }));
      return;
    }
    const found = members.find((m) => m.id === selectedId);
    if (!found) return;

    setFormData((prev) => {
      const shouldAutoDesc =
        prev.category === 'Iuran Anggota' &&
        (!prev.description.trim() || prev.description.startsWith('Iuran Anggota'));
      const periodText = formatPeriodFromDate(prev.date);
      return {
        ...prev,
        memberId: found.id,
        memberName: found.fullName,
        memberNumber: found.memberNumber,
        description: shouldAutoDesc
          ? `Iuran Anggota (${periodText}) - ${found.fullName} (${found.businessName})`
          : prev.description,
      };
    });
  };

  // Image Upload handler with validation & compression
  const handleProofImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileCheck = validateUploadedFile(file, 'image');
    if (!fileCheck.valid) {
      alert(fileCheck.error || 'Mohon pilih file gambar (JPG, PNG, WEBP) maksimal 5MB.');
      if (e.target) e.target.value = '';
      return;
    }

    try {
      const compressed = await compressImage(file, 800, 800, 0.78);
      setFormData((prev) => ({
        ...prev,
        proofUrl: compressed,
      }));
    } catch (err: any) {
      alert('Gagal memproses bukti gambar: ' + (err?.message || 'Format tidak didukung'));
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateTransactionInput(formData);
    if (!validation.valid) {
      alert(validation.errors[0] || 'Data transaksi tidak valid.');
      return;
    }

    try {
      const id = 'trx-' + Date.now();
      const newTx: Transaction = {
        ...validation.sanitized,
        id,
        transactionNumber: formData.transactionNumber || validation.sanitized.transactionNumber,
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
      try {
        await dbService.addLog({
          userId: profile?.uid || 'usr-bendahara',
          userName: profile?.displayName || 'Bendahara',
          action: 'Catat Transaksi Keuangan',
          target: newTx.transactionNumber,
          details: `${newTx.type.toUpperCase()}: ${newTx.category} - Rp ${newTx.amount.toLocaleString('id-ID')} (${newTx.description})`,
        });
      } catch (logErr) {
        console.warn('Logging non-fatal error:', logErr);
      }

      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert('Gagal menyimpan transaksi: ' + (err?.message || 'Terjadi kesalahan sistem'));
    }
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

  // Sorted & filtered members for transaction form picker
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [members]);

  const pickerFilteredMembers = useMemo(() => {
    const q = memberPickerSearch.trim().toLowerCase();
    if (!q) return sortedMembers;
    return sortedMembers.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.businessName.toLowerCase().includes(q) ||
        (m.memberNumber || '').toLowerCase().includes(q) ||
        (m.kelurahan || '').toLowerCase().includes(q)
    );
  }, [sortedMembers, memberPickerSearch]);

  const selectedFormMember = useMemo(() => {
    if (!formData.memberId) return undefined;
    return members.find((m) => m.id === formData.memberId);
  }, [members, formData.memberId]);

  // Filtered transactions based on tab and inputs
  const displayedTransactions = useMemo(() => {
    return runningCashBook.filter((t) => {
      if (activeTab === 'pemasukan' && t.type !== 'pemasukan') return false;
      if (activeTab === 'pengeluaran' && t.type !== 'pengeluaran') return false;
      if (activeTab === 'rekap_iuran' && t.category !== 'Iuran Anggota') return false;

      const q = search.toLowerCase();
      const matchSearch =
        search === '' ||
        t.transactionNumber.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.memberName || '').toLowerCase().includes(q) ||
        (t.memberNumber || '').toLowerCase().includes(q);

      const matchCategory = filterCategory === 'all' || t.category === filterCategory;

      return matchSearch && matchCategory;
    });
  }, [runningCashBook, activeTab, search, filterCategory]);

  // Rekap Iuran Anggota computations (Month & Year filtering)
  const availableDuesYears = useMemo(() => getAvailableYears(transactions), [transactions]);

  const periodDuesTransactions = useMemo(
    () => filterDuesTransactions(transactions, duesMonth, duesYear),
    [transactions, duesMonth, duesYear]
  );

  const memberDuesStatuses = useMemo(
    () => buildMemberDuesSummary(members, periodDuesTransactions),
    [members, periodDuesTransactions]
  );

  const displayedDuesTransactions = useMemo(() => {
    const q = duesSearch.trim().toLowerCase();
    if (!q) return periodDuesTransactions;
    return periodDuesTransactions.filter((tx) => {
      const matched = resolveTransactionMember(tx, members);
      return (
        tx.transactionNumber.toLowerCase().includes(q) ||
        tx.description.toLowerCase().includes(q) ||
        (tx.memberName || '').toLowerCase().includes(q) ||
        (tx.memberNumber || '').toLowerCase().includes(q) ||
        (matched?.businessName || '').toLowerCase().includes(q) ||
        (matched?.kelurahan || '').toLowerCase().includes(q)
      );
    });
  }, [periodDuesTransactions, duesSearch, members]);

  const displayedMemberDues = useMemo(() => {
    const q = duesSearch.trim().toLowerCase();
    if (!q) return memberDuesStatuses;
    return memberDuesStatuses.filter(
      (row) =>
        row.member.fullName.toLowerCase().includes(q) ||
        row.member.businessName.toLowerCase().includes(q) ||
        (row.member.memberNumber || '').toLowerCase().includes(q) ||
        (row.member.kelurahan || '').toLowerCase().includes(q)
    );
  }, [memberDuesStatuses, duesSearch]);

  const duesPeriodApprovedTotal = useMemo(() => {
    return periodDuesTransactions
      .filter((t) => t.approvalStatus === 'disetujui')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [periodDuesTransactions]);

  const duesActiveMembersCount = useMemo(
    () => memberDuesStatuses.filter((r) => r.member.status === 'aktif').length,
    [memberDuesStatuses]
  );

  const duesPaidActiveCount = useMemo(
    () => memberDuesStatuses.filter((r) => r.member.status === 'aktif' && r.isPaid).length,
    [memberDuesStatuses]
  );

  const duesPeriodLabel = useMemo(() => {
    const mLabel = getMonthLabel(duesMonth);
    const yLabel = duesYear === 'all' ? 'Semua Tahun' : duesYear;
    return `${mLabel} ${yLabel}`;
  }, [duesMonth, duesYear]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleExportCSV = () => {
    const headers = ['No. Transaksi', 'Tanggal', 'Tipe', 'Kategori', 'Anggota', 'Uraian', 'Pemasukan', 'Pengeluaran', 'Pencatat', 'Status'];
    const rows = displayedTransactions.map((t) => [
      `"${t.transactionNumber}"`,
      `"${t.date}"`,
      `"${t.type}"`,
      `"${t.category}"`,
      `"${(t.memberName || '-').replace(/"/g, '""')}"`,
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

  const handleExportDuesExcel = () => {
    try {
      exportDuesExcel({
        transactions: periodDuesTransactions,
        members,
        memberStatuses: memberDuesStatuses,
        month: duesMonth,
        year: duesYear,
        viewMode: duesViewMode,
      });
    } catch (err: any) {
      alert('Gagal mengekspor Excel rekap iuran: ' + (err?.message || 'Terjadi kesalahan'));
    }
  };

  const handleExportDuesPdf = async () => {
    try {
      setIsExportingDuesPdf(true);
      await exportDuesOfficialPdf({
        transactions: periodDuesTransactions,
        members,
        memberStatuses: memberDuesStatuses,
        month: duesMonth,
        year: duesYear,
        viewMode: duesViewMode,
      });
    } catch (err: any) {
      alert('Gagal membuat PDF resmi rekap iuran: ' + (err?.message || 'Terjadi kesalahan'));
    } finally {
      setIsExportingDuesPdf(false);
    }
  };

  const triggerPrintDocument = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
            Buku Kas & Manajemen Keuangan
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Pencatatan kas internal, iuran anggota, donasi, bantuan pemerintah, dan pengeluaran kegiatan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-white hover:bg-stone-50 text-stone-700 px-3.5 py-2.5 min-h-[42px] rounded-xl border border-stone-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-teal-700" />
            <span>Ekspor Buku Kas</span>
          </button>

          <button
            onClick={() => setPrintModalOpen(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-stone-50 text-stone-700 px-3.5 py-2.5 min-h-[42px] rounded-xl border border-stone-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-teal-700" />
            <span>Cetak PDF Resmi</span>
          </button>

          {canManageFinances && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleOpenAdd('pemasukan')}
                className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-3.5 py-2.5 min-h-[42px] rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Pemasukan</span>
              </button>
              <button
                onClick={() => handleOpenAdd('pengeluaran')}
                className="flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white px-3.5 py-2.5 min-h-[42px] rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Pengeluaran</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4 Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Akhir */}
        <div className="bg-[#121918] text-white rounded-2xl p-5 border border-stone-800 space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
            Saldo Kas Berjalan
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums tracking-tight">
            {formatRupiah(saldoKas)}
          </div>
          <div className="text-[11px] text-stone-400 pt-0.5">
            Dihitung otomatis dari transaksi disetujui
          </div>
        </div>

        {/* Total Pemasukan */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Total Pemasukan
            </span>
            <div className="h-8 w-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-teal-700 tabular-nums tracking-tight">
            {formatRupiah(totalPemasukan)}
          </div>
          <div className="text-[11px] text-stone-500">
            Iuran, bantuan, donasi, sponsorship
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Total Pengeluaran
            </span>
            <div className="h-8 w-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-700">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-red-700 tabular-nums tracking-tight">
            {formatRupiah(totalPengeluaran)}
          </div>
          <div className="text-[11px] text-stone-500">
            Operasional, sewa bazar, narasumber
          </div>
        </div>

        {/* Rekap Iuran */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Penerimaan Iuran
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-700 tabular-nums tracking-tight">
            {formatRupiah(totalIuran)}
          </div>
          <div className="text-[11px] text-stone-500">
            Kontribusi iuran rutin bulanan anggota
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-2.5">
        <button
          onClick={() => setActiveTab('buku_kas')}
          className={`px-4 py-2 min-h-[40px] rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'buku_kas'
              ? 'bg-[#121918] text-white'
              : 'text-stone-600 hover:bg-stone-100 border border-transparent hover:border-stone-200'
          }`}
        >
          Buku Kas Umum (Semua)
        </button>
        <button
          onClick={() => setActiveTab('pemasukan')}
          className={`px-4 py-2 min-h-[40px] rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'pemasukan'
              ? 'bg-teal-700 text-white'
              : 'text-stone-600 hover:bg-stone-100 border border-transparent hover:border-stone-200'
          }`}
        >
          Pemasukan Kas
        </button>
        <button
          onClick={() => setActiveTab('pengeluaran')}
          className={`px-4 py-2 min-h-[40px] rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'pengeluaran'
              ? 'bg-red-700 text-white'
              : 'text-stone-600 hover:bg-stone-100 border border-transparent hover:border-stone-200'
          }`}
        >
          Pengeluaran Kas
        </button>
        <button
          onClick={() => setActiveTab('rekap_iuran')}
          className={`px-4 py-2 min-h-[40px] rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'rekap_iuran'
              ? 'bg-amber-600 text-white'
              : 'text-stone-600 hover:bg-stone-100 border border-transparent hover:border-stone-200'
          }`}
        >
          Rekap Iuran Anggota
        </button>
      </div>

      {activeTab === 'rekap_iuran' ? (
        <div className="space-y-4">
          {/* Rekap Iuran Anggota Controls & Export Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-stone-900">
                  Rekapitulasi Transaksi Iuran Anggota
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Pilih bulan dan tahun untuk melihat rekap iuran anggota serta mengunduh laporan Excel atau PDF resmi.
                </p>
              </div>

              {canManageFinances && (
                <button
                  type="button"
                  onClick={() => handleOpenAdd('pemasukan', 'Iuran Anggota')}
                  className="btn-micro inline-flex items-center justify-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-4 py-2.5 min-h-[42px] rounded-xl text-xs font-bold cursor-pointer self-start lg:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Catat Iuran Anggota</span>
                </button>
              )}
            </div>

            {/* Period Filters (Bulan, Tahun) + Search + View Switcher */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-1">
              <div className="lg:col-span-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Pilihan Bulan
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                  <select
                    value={duesMonth}
                    onChange={(e) => setDuesMonth(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 min-h-[42px] text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:border-teal-600 text-stone-800 font-semibold"
                  >
                    {MONTH_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Pilihan Tahun
                </label>
                <select
                  value={duesYear}
                  onChange={(e) => setDuesYear(e.target.value)}
                  className="w-full px-3 py-2 min-h-[42px] text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:border-teal-600 text-stone-800 font-semibold tabular-nums"
                >
                  <option value="all">Semua Tahun</option>
                  {availableDuesYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-4">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Cari Anggota / No. Transaksi
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={duesSearch}
                    onChange={(e) => setDuesSearch(e.target.value)}
                    placeholder="Nama anggota, usaha, no. anggota, kelurahan..."
                    className="w-full pl-9 pr-3 py-2 min-h-[42px] text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:border-teal-600 text-stone-900"
                  />
                </div>
              </div>

              <div className="lg:col-span-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Mode Tampilan Rekap
                </label>
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-stone-100 border border-stone-200 min-h-[42px]">
                  <button
                    type="button"
                    onClick={() => setDuesViewMode('transaksi')}
                    className={`rounded-lg px-2 py-1.5 text-[11px] font-bold transition-colors cursor-pointer ${
                      duesViewMode === 'transaksi'
                        ? 'bg-[#121918] text-white'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Transaksi
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuesViewMode('status_anggota')}
                    className={`rounded-lg px-2 py-1.5 text-[11px] font-bold transition-colors cursor-pointer ${
                      duesViewMode === 'status_anggota'
                        ? 'bg-[#121918] text-white'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Per Anggota
                  </button>
                </div>
              </div>
            </div>

            {/* Download Excel & Official PDF Bar */}
            <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-stone-600">
                Periode aktif:{' '}
                <span className="font-bold text-stone-900">{duesPeriodLabel}</span>
                <span className="mx-1.5 text-stone-300">|</span>
                <span className="tabular-nums font-medium text-stone-500">
                  {periodDuesTransactions.length} transaksi tercatat
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportDuesExcel}
                  className="btn-micro inline-flex items-center gap-1.5 bg-white hover:bg-stone-50 text-stone-800 px-3.5 py-2.5 min-h-[42px] rounded-xl border border-stone-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-teal-700" />
                  <span>Download Excel (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDuesPrintModalOpen(true)}
                  className="btn-micro inline-flex items-center gap-1.5 bg-white hover:bg-stone-50 text-stone-800 px-3.5 py-2.5 min-h-[42px] rounded-xl border border-stone-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-stone-700" />
                  <span>Pratinjau Kop Surat</span>
                </button>

                <button
                  type="button"
                  disabled={isExportingDuesPdf}
                  onClick={handleExportDuesPdf}
                  className="btn-micro inline-flex items-center gap-1.5 bg-[#121918] hover:bg-stone-800 text-white px-4 py-2.5 min-h-[42px] rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-70"
                >
                  <FileText className="w-4 h-4 text-teal-400" />
                  {isExportingDuesPdf ? (
                    <InlineShimmer variant="dark" label="Membuat PDF Resmi" widthClass="w-24" />
                  ) : (
                    <span>Download PDF Resmi</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 3 Summary Cards for Selected Month/Year */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Penerimaan Iuran ({duesPeriodLabel})
              </span>
              <div className="text-2xl font-extrabold text-teal-700 tabular-nums tracking-tight">
                {formatRupiah(duesPeriodApprovedTotal)}
              </div>
              <div className="text-[11px] text-stone-500">
                Total iuran anggota berstatus disetujui
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Jumlah Transaksi Iuran
              </span>
              <div className="text-2xl font-extrabold text-stone-900 tabular-nums tracking-tight">
                {periodDuesTransactions.length} Transaksi
              </div>
              <div className="text-[11px] text-stone-500">
                Catatan masuk kategori Iuran Anggota
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Partisipasi Anggota Aktif
              </span>
              <div className="text-2xl font-extrabold text-amber-700 tabular-nums tracking-tight">
                {duesPaidActiveCount} / {duesActiveMembersCount} Anggota
              </div>
              <div className="text-[11px] text-stone-500 tabular-nums">
                {Math.max(0, duesActiveMembersCount - duesPaidActiveCount)} anggota aktif belum tercatat bayar
              </div>
            </div>
          </div>

          {/* Rekap Table: Transaction Log vs Per-Member Status */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            {duesViewMode === 'transaksi' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 border-b border-stone-200 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">No. Transaksi</th>
                      <th className="px-4 py-3.5">Tanggal</th>
                      <th className="px-4 py-3.5">Anggota Pembayar</th>
                      <th className="px-4 py-3.5">Uraian Keterangan</th>
                      <th className="px-4 py-3.5 text-right text-teal-800">Nominal (Rp)</th>
                      <th className="px-4 py-3.5 text-center">Status</th>
                      <th className="px-4 py-3.5 text-center">Bukti</th>
                      <th className="px-4 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {displayedDuesTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-stone-400">
                          <div className="max-w-sm mx-auto space-y-2.5">
                            <div className="h-12 w-12 mx-auto rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400">
                              <Wallet className="w-6 h-6" />
                            </div>
                            <div className="font-bold text-stone-800 text-sm">
                              Belum Ada Transaksi Iuran pada {duesPeriodLabel}
                            </div>
                            <p className="text-xs text-stone-500">
                              Pilih bulan/tahun lain atau catat transaksi iuran anggota baru pada periode ini.
                            </p>
                            {canManageFinances && (
                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenAdd('pemasukan', 'Iuran Anggota')}
                                  className="px-4 py-2.5 min-h-[42px] bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>Catat Iuran Anggota</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      displayedDuesTransactions.map((tx) => {
                        const matched = resolveTransactionMember(tx, members);
                        const displayName = tx.memberName || matched?.fullName;
                        const displayNumber = tx.memberNumber || matched?.memberNumber;
                        return (
                          <tr key={tx.id} className="hover:bg-stone-50/80 transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-stone-900 whitespace-nowrap tabular-nums">
                              {tx.transactionNumber}
                            </td>
                            <td className="px-4 py-3 text-stone-600 whitespace-nowrap tabular-nums">
                              {tx.date}
                            </td>
                            <td className="px-4 py-3">
                              {displayName ? (
                                <div>
                                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-teal-700 flex-shrink-0" />
                                    <span>{displayName}</span>
                                  </div>
                                  <div className="text-[11px] text-stone-500 font-mono tabular-nums">
                                    {displayNumber || '-'}
                                    {matched?.businessName ? ` • ${matched.businessName}` : ''}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-stone-400 italic">Tidak ditautkan ke anggota</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-stone-700 max-w-xs">
                              <div className="line-clamp-2">{tx.description}</div>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-teal-700 whitespace-nowrap tabular-nums">
                              {formatRupiah(tx.amount)}
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                                  tx.approvalStatus === 'disetujui'
                                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                                    : tx.approvalStatus === 'menunggu'
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : 'bg-red-50 text-red-700 border-red-200'
                                }`}
                              >
                                {tx.approvalStatus === 'disetujui'
                                  ? 'Disetujui'
                                  : tx.approvalStatus === 'menunggu'
                                    ? 'Menunggu'
                                    : 'Ditolak'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              {tx.proofUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedTx(tx)}
                                  className="inline-flex items-center gap-1 text-[11px] bg-teal-50 text-teal-800 font-bold px-2.5 py-1 rounded-md border border-teal-200 hover:bg-teal-100 cursor-pointer"
                                >
                                  <Paperclip className="w-3 h-3" />
                                  <span>Ada Bukti</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-stone-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setSelectedTx(tx)}
                                className="text-xs text-teal-700 hover:text-teal-900 font-bold hover:underline cursor-pointer"
                              >
                                Lihat Rincian
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {displayedDuesTransactions.length > 0 && (
                    <tfoot className="bg-stone-50 border-t border-stone-200 font-bold">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-right text-stone-700">
                          Total Iuran Disetujui ({duesPeriodLabel}):
                        </td>
                        <td className="px-4 py-3 text-right text-teal-800 font-extrabold tabular-nums">
                          {formatRupiah(
                            displayedDuesTransactions
                              .filter((t) => t.approvalStatus === 'disetujui')
                              .reduce((acc, t) => acc + Number(t.amount || 0), 0)
                          )}
                        </td>
                        <td colSpan={3} />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 border-b border-stone-200 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">No. Anggota</th>
                      <th className="px-4 py-3.5">Nama Anggota &amp; Usaha</th>
                      <th className="px-4 py-3.5">Kelurahan</th>
                      <th className="px-4 py-3.5">Tgl Bayar</th>
                      <th className="px-4 py-3.5">No. Bukti</th>
                      <th className="px-4 py-3.5 text-right">Total Iuran</th>
                      <th className="px-4 py-3.5 text-center">Status ({duesPeriodLabel})</th>
                      <th className="px-4 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {displayedMemberDues.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-stone-400">
                          <div className="max-w-xs mx-auto space-y-2">
                            <div className="h-12 w-12 mx-auto rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400">
                              <Users className="w-6 h-6" />
                            </div>
                            <div className="font-bold text-stone-800 text-sm">
                              Data Anggota Tidak Ditemukan
                            </div>
                            <p className="text-xs text-stone-500">
                              {members.length === 0
                                ? 'Belum ada anggota terdaftar di direktori keanggotaan.'
                                : 'Tidak ada anggota yang sesuai dengan kata kunci pencarian.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      displayedMemberDues.map((row) => (
                        <tr key={row.member.id} className="hover:bg-stone-50/80 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-stone-800 whitespace-nowrap tabular-nums">
                            {row.member.memberNumber}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-stone-900">{row.member.fullName}</div>
                            <div className="text-[11px] text-stone-500">{row.member.businessName}</div>
                          </td>
                          <td className="px-4 py-3 text-stone-600 whitespace-nowrap">
                            {row.member.kelurahan}
                          </td>
                          <td className="px-4 py-3 text-stone-600 whitespace-nowrap tabular-nums">
                            {row.lastPaymentDate}
                          </td>
                          <td className="px-4 py-3 font-mono text-stone-700 whitespace-nowrap tabular-nums">
                            {row.lastTransactionNumber}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-stone-900 whitespace-nowrap tabular-nums">
                            {row.totalAmount > 0 ? formatRupiah(row.totalAmount) : '-'}
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {row.isPaid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Lunas ({row.paidCount}x)</span>
                              </span>
                            ) : (
                              <span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                Belum Bayar
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {row.transactions[0] ? (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedTx(row.transactions[0])}
                                  className="text-xs text-teal-700 hover:text-teal-900 font-bold hover:underline cursor-pointer"
                                >
                                  Rincian
                                </button>
                                {canManageFinances && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAddForMember(row.member)}
                                    className="text-xs text-stone-600 hover:text-stone-900 font-semibold hover:underline cursor-pointer"
                                  >
                                    + Catat
                                  </button>
                                )}
                              </div>
                            ) : canManageFinances ? (
                              <button
                                type="button"
                                onClick={() => handleOpenAddForMember(row.member)}
                                className="inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900 font-bold hover:underline cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Catat Iuran</span>
                              </button>
                            ) : (
                              <span className="text-stone-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari uraian, anggota, atau no. transaksi..."
                className="w-full pl-9 pr-3 py-2 min-h-[42px] text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:border-teal-600 text-stone-900"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 min-h-[42px] text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:border-teal-600 text-stone-700 font-medium"
              >
                <option value="all">Semua Kategori</option>
                <option value="Iuran Anggota">Iuran Anggota</option>
                <option value="Bantuan & Hibah">Bantuan &amp; Hibah</option>
                <option value="Sponsor & Donasi">Sponsor &amp; Donasi</option>
                <option value="Operasional Sekretariat">Operasional Sekretariat</option>
                <option value="Kegiatan & Bazar">Kegiatan &amp; Bazar</option>
                <option value="Pelatihan & Pembinaan">Pelatihan &amp; Pembinaan</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 border-b border-stone-200 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">No. Transaksi</th>
                    <th className="px-4 py-3.5">Tanggal</th>
                    <th className="px-4 py-3.5">Kategori &amp; Uraian</th>
                    <th className="px-4 py-3.5 text-right text-teal-800">Masuk (Debit)</th>
                    <th className="px-4 py-3.5 text-right text-red-700">Keluar (Kredit)</th>
                    <th className="px-4 py-3.5 text-right font-extrabold text-stone-900">Saldo</th>
                    <th className="px-4 py-3.5 text-center">Bukti Nota</th>
                    <th className="px-4 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {displayedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-stone-400">
                        <div className="max-w-xs mx-auto space-y-2.5">
                          <div className="h-12 w-12 mx-auto rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400">
                            <Wallet className="w-6 h-6" />
                          </div>
                          <div className="font-bold text-stone-800 text-sm">Belum Ada Catatan Kas</div>
                          <p className="text-xs text-stone-500">
                            {transactions.length === 0
                              ? 'Buku kas masih kosong dengan saldo Rp 0. Silakan catat transaksi kas atau iuran pertama.'
                              : 'Tidak ada catatan transaksi yang sesuai filter.'}
                          </p>
                          {transactions.length === 0 && (
                            <div className="pt-2">
                              <button
                                onClick={() => handleOpenAdd()}
                                className="px-4 py-2.5 min-h-[42px] bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
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
                      <tr key={tx.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-stone-900 whitespace-nowrap tabular-nums">
                          {tx.transactionNumber}
                        </td>
                        <td className="px-4 py-3 text-stone-600 whitespace-nowrap tabular-nums">{tx.date}</td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-stone-800 flex flex-wrap items-center gap-1.5">
                            <span>{tx.category}</span>
                            {tx.memberName && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-md">
                                <User className="w-2.5 h-2.5" />
                                {tx.memberName}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500 line-clamp-1">{tx.description}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-teal-700 whitespace-nowrap tabular-nums">
                          {tx.type === 'pemasukan' ? formatRupiah(tx.amount) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-red-700 whitespace-nowrap tabular-nums">
                          {tx.type === 'pengeluaran' ? formatRupiah(tx.amount) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-stone-900 whitespace-nowrap tabular-nums">
                          {formatRupiah(tx.runningBalance)}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {tx.proofUrl ? (
                            <button
                              onClick={() => setSelectedTx(tx)}
                              className="inline-flex items-center gap-1 text-[11px] bg-teal-50 text-teal-800 font-bold px-2.5 py-1 rounded-md border border-teal-200 hover:bg-teal-100 cursor-pointer"
                            >
                              <Paperclip className="w-3 h-3" />
                              <span>Ada Bukti</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-stone-400">-</span>
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
        </>
      )}

      {/* MODAL CATAT TRANSAKSI DENGAN UPLOAD BUKTI TRANSFER LANGSUNG */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/65">
          <div className="bg-white w-full max-w-xl rounded-2xl overflow-hidden border border-stone-200 max-h-[92vh] flex flex-col">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div>
                <h3 className="font-extrabold text-stone-900 text-lg">
                  Catat Transaksi Kas Baru
                </h3>
                <span className="text-xs font-mono font-bold text-teal-700 tabular-nums">
                  {formData.transactionNumber}
                </span>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200/70 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
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
                        ...(t === 'pengeluaran'
                          ? { memberId: '', memberName: '', memberNumber: '' }
                          : {}),
                      });
                    }}
                    className="w-full px-3 py-2 min-h-[42px] text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:border-teal-600 font-bold text-stone-900"
                  >
                    <option value="pemasukan">Pemasukan (Debit)</option>
                    <option value="pengeluaran">Pengeluaran (Kredit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Tanggal Transaksi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 min-h-[42px] text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:border-teal-600 font-medium tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 min-h-[42px] text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:border-teal-600 font-medium text-stone-900"
                  >
                    {formData.type === 'pemasukan' ? (
                      <>
                        <option value="Iuran Anggota">Iuran Anggota</option>
                        <option value="Bantuan & Hibah">Bantuan &amp; Hibah</option>
                        <option value="Sponsor & Donasi">Sponsor &amp; Donasi</option>
                        <option value="Pendapatan Bazar / Acara">Pendapatan Bazar / Acara</option>
                        <option value="Lainnya">Lainnya</option>
                      </>
                    ) : (
                      <>
                        <option value="Operasional Sekretariat">Operasional Sekretariat</option>
                        <option value="Kegiatan & Bazar">Kegiatan &amp; Bazar</option>
                        <option value="Pelatihan & Pembinaan">Pelatihan &amp; Pembinaan</option>
                        <option value="Konsumsi & Rapat">Konsumsi &amp; Rapat</option>
                        <option value="Pengadaan & Sarana">Pengadaan &amp; Sarana</option>
                        <option value="Lainnya">Lainnya</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Nominal (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    placeholder="Contoh: 50000"
                    className="w-full px-3 py-2 min-h-[42px] text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:border-teal-600 font-mono font-bold text-stone-900 tabular-nums"
                  />
                </div>
              </div>

              {/* Pilihan Nama Anggota (ditampilkan pada transaksi Pemasukan) */}
              {formData.type === 'pemasukan' && (
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-3.5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-teal-700" />
                      <span>Nama Anggota UMKM</span>
                    </label>
                    <span className="text-[11px] font-semibold text-stone-500">
                      {formData.category === 'Iuran Anggota'
                        ? 'Disarankan untuk rekap iuran anggota'
                        : 'Opsional'}
                    </span>
                  </div>

                  {members.length === 0 ? (
                    <p className="text-[11px] text-stone-500">
                      Belum ada data anggota terdaftar. Anda tetap dapat menyimpan transaksi pemasukan ini secara umum.
                    </p>
                  ) : (
                    <>
                      {members.length > 6 && (
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input
                            type="text"
                            value={memberPickerSearch}
                            onChange={(e) => setMemberPickerSearch(e.target.value)}
                            placeholder="Filter cepat nama anggota, usaha, atau nomor anggota..."
                            className="w-full pl-8 pr-3 py-1.5 min-h-[38px] text-xs rounded-lg border border-stone-200 bg-white focus:outline-hidden focus:border-teal-600 text-stone-900"
                          />
                        </div>
                      )}

                      <select
                        value={formData.memberId || ''}
                        onChange={(e) => handleSelectMemberInForm(e.target.value)}
                        className="w-full px-3 py-2 min-h-[42px] text-xs rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-teal-600 font-medium text-stone-900"
                      >
                        <option value="">-- Pilih Nama Anggota (Opsional / Umum) --</option>
                        {pickerFilteredMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.fullName} — {m.businessName} ({m.memberNumber})
                          </option>
                        ))}
                      </select>

                      {formData.memberName && (
                        <div className="flex items-center justify-between gap-2 bg-teal-50/70 border border-teal-200 rounded-lg px-3 py-2">
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-teal-900 truncate">
                              {formData.memberName}
                            </div>
                            <div className="text-[11px] text-teal-700 font-mono truncate tabular-nums">
                              {formData.memberNumber || '-'}
                              {selectedFormMember
                                ? ` • ${selectedFormMember.businessName} (Kel. ${selectedFormMember.kelurahan})`
                                : ''}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSelectMemberInForm('')}
                            className="text-[11px] font-bold text-stone-600 hover:text-red-700 px-2 py-1 rounded-md hover:bg-white transition-colors cursor-pointer flex-shrink-0"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Uraian Keterangan Transaksi <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Penjelasan rinci peruntukan dana atau sumber penerimaan..."
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:border-teal-600 text-stone-900"
                />
              </div>

              {/* UPLOAD BUKTI TRANSFER / NOTA LANGSUNG (GAMBAR / FOTO / SCREENSHOT) */}
              <div className="space-y-2.5 pt-3 border-t border-stone-200">
                <label className="block text-xs font-bold text-stone-800">
                  Bukti Transfer / Nota / Tangkapan Layar
                </label>

                {formData.proofUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-teal-500 bg-stone-50 p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={formData.proofUrl}
                        alt="Bukti Transfer"
                        className="h-16 w-16 object-cover rounded-lg border border-stone-300"
                      />
                      <div>
                        <div className="text-xs font-bold text-teal-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                          <span>Bukti Gambar Terlampir</span>
                        </div>
                        <span className="text-[11px] text-stone-500">Siap disimpan bersama transaksi</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, proofUrl: '' })}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                      title="Hapus Bukti"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-stone-300 hover:border-teal-600 bg-stone-50 hover:bg-teal-50/40 p-4 rounded-xl text-center cursor-pointer transition-colors"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleProofImageUpload}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center justify-center space-y-1.5">
                        <div className="h-10 w-10 rounded-full bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                          <Camera className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-bold text-teal-800">
                          Klik untuk Upload Foto / Tangkapan Layar (Screenshot) Bukti Transfer
                        </div>
                        <div className="text-[11px] text-stone-500">
                          Mendukung kamera HP langsung, file JPG, PNG, atau screenshot m-Banking
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-stone-500">
                      <span>atau masukkan URL gambar eksternal jika ada:</span>
                    </div>
                    <input
                      type="url"
                      value={formData.proofUrl}
                      onChange={(e) => setFormData({ ...formData, proofUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 min-h-[40px] text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:border-teal-600"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 min-h-[42px] text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 min-h-[42px] bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/65">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden border border-stone-200 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <span className="font-mono font-bold text-teal-700 text-xs tabular-nums">
                {selectedTx.transactionNumber}
              </span>
              <button onClick={() => setSelectedTx(null)} className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200/70 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="text-center py-2 space-y-1">
                <span className="text-xs uppercase font-bold text-stone-400">
                  {selectedTx.type.toUpperCase()} &bull; {selectedTx.category}
                </span>
                <div
                  className={`text-2xl font-extrabold tabular-nums ${
                    selectedTx.type === 'pemasukan' ? 'text-teal-700' : 'text-red-700'
                  }`}
                >
                  {selectedTx.type === 'pemasukan' ? '+' : '-'} {formatRupiah(selectedTx.amount)}
                </div>
                <div className="text-xs text-stone-500 tabular-nums">{selectedTx.date}</div>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs space-y-2.5">
                {selectedTx.memberName && (
                  <div>
                    <span className="text-stone-400 font-semibold">Anggota Pembayar:</span>
                    <div className="font-bold text-teal-800">
                      {selectedTx.memberName}
                      {selectedTx.memberNumber ? (
                        <span className="ml-1.5 font-mono text-[11px] text-stone-600 tabular-nums">
                          ({selectedTx.memberNumber})
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-stone-400 font-semibold">Uraian:</span>
                  <div className="font-semibold text-stone-800">{selectedTx.description}</div>
                </div>
                <div>
                  <span className="text-stone-400 font-semibold">Pencatat / Pemohon:</span>
                  <div className="text-stone-700">{selectedTx.recorderName}</div>
                </div>
                {selectedTx.approvedBy && (
                  <div>
                    <span className="text-stone-400 font-semibold">Disetujui Oleh:</span>
                    <div className="text-stone-700 font-medium">{selectedTx.approvedBy}</div>
                  </div>
                )}
              </div>

              {selectedTx.proofUrl ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                    <span>Lampiran Bukti Nota / Transfer:</span>
                    <a
                      href={selectedTx.proofUrl}
                      download={`Bukti_${selectedTx.transactionNumber}.png`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-700 hover:underline"
                    >
                      Buka Gambar Asli
                    </a>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-stone-200 max-h-72 bg-stone-100 flex items-center justify-center">
                    <img
                      src={selectedTx.proofUrl}
                      alt="Bukti Transaksi"
                      className="w-full h-auto max-h-72 object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-500">
                  Tidak ada lampiran bukti nota pada transaksi ini.
                </div>
              )}
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setSelectedTx(null)}
                className="bg-[#121918] hover:bg-stone-800 text-white px-5 py-2.5 min-h-[42px] rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED MODAL CETAK PDF RESMI BUKU KAS UMUM */}
      {printModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/65">
          <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden border border-stone-200 max-h-[92vh] flex flex-col">
            <div className="p-4 bg-[#121918] text-white flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-teal-400" />
                <span className="font-bold text-sm">Pratinjau Cetak PDF Buku Kas Umum</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={triggerPrintDocument}
                  className="bg-teal-700 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Simpan PDF Sekarang</span>
                </button>
                <button
                  onClick={() => setPrintModalOpen(false)}
                  className="text-stone-400 hover:text-white p-1.5 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
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
                    Sekretariat: Gedung Kantor Kecamatan Tangerang, Jl. Daan Mogot No. 5, Kota Tangerang. Telp: (021) 5523456 / WA +62 82258570582
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

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end gap-2">
              <button
                onClick={() => setPrintModalOpen(false)}
                className="px-4 py-2.5 min-h-[42px] text-xs font-semibold text-stone-600 hover:bg-stone-200 rounded-xl cursor-pointer transition-colors"
              >
                Tutup
              </button>
              <button
                onClick={triggerPrintDocument}
                className="bg-teal-700 hover:bg-teal-800 text-white px-5 py-2.5 min-h-[42px] rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Cetak ke PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRATINJAU & CETAK PDF RESMI REKAP IURAN ANGGOTA */}
      {duesPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/65">
          <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden border border-stone-200 max-h-[92vh] flex flex-col">
            <div className="p-4 bg-[#121918] text-white flex flex-wrap items-center justify-between gap-2 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                <span className="font-bold text-sm">
                  Pratinjau Laporan Resmi Rekap Iuran ({duesPeriodLabel})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isExportingDuesPdf}
                  onClick={handleExportDuesPdf}
                  className="bg-teal-700 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-70"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isExportingDuesPdf ? (
                    <InlineShimmer variant="dark" label="Membuat PDF Resmi" widthClass="w-24" />
                  ) : (
                    <span>Download PDF Resmi</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={triggerPrintDocument}
                  className="bg-stone-800 hover:bg-stone-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-stone-700 cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDuesPrintModalOpen(false)}
                  className="text-stone-400 hover:text-white p-1.5 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Letterhead Preview */}
            <div className="p-6 sm:p-10 overflow-y-auto space-y-6 print:p-0">
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
                    Sekretariat: Gedung Kantor Kecamatan Tangerang, Jl. Daan Mogot No. 5, Kota Tangerang. Telp: (021) 5523456 / WA +62 82258570582
                  </p>
                </div>
              </div>

              <div className="text-center space-y-1">
                <h2 className="text-lg font-black text-slate-900 uppercase underline decoration-2 underline-offset-4">
                  {duesViewMode === 'status_anggota'
                    ? 'LAPORAN REKAPITULASI STATUS IURAN PER ANGGOTA'
                    : 'LAPORAN REKAPITULASI TRANSAKSI IURAN ANGGOTA'}
                </h2>
                <div className="text-xs text-slate-600 font-semibold">
                  Periode: {duesPeriodLabel} &bull; Dicetak pada:{' '}
                  {new Date().toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-300 text-xs">
                <div>
                  <span className="text-slate-500">Total Penerimaan Iuran:</span>
                  <div className="text-sm font-black text-teal-700 tabular-nums">
                    {formatRupiah(duesPeriodApprovedTotal)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Jumlah Transaksi Iuran:</span>
                  <div className="text-sm font-black text-slate-900 tabular-nums">
                    {periodDuesTransactions.length} Transaksi
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Partisipasi Anggota Aktif:</span>
                  <div className="text-sm font-black text-slate-900 tabular-nums">
                    {duesPaidActiveCount} / {duesActiveMembersCount} Anggota
                  </div>
                </div>
              </div>

              {duesViewMode === 'status_anggota' ? (
                <table className="w-full text-left text-[11px] border border-slate-300">
                  <thead className="bg-slate-100 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300 text-center">No.</th>
                      <th className="p-2 border-r border-slate-300">No. Anggota</th>
                      <th className="p-2 border-r border-slate-300">Nama Anggota</th>
                      <th className="p-2 border-r border-slate-300">Nama Usaha</th>
                      <th className="p-2 border-r border-slate-300">Kelurahan</th>
                      <th className="p-2 border-r border-slate-300 text-center">Tgl Bayar</th>
                      <th className="p-2 border-r border-slate-300 text-center">Status</th>
                      <th className="p-2 text-right">Iuran (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {memberDuesStatuses.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-slate-500 italic">
                          Belum ada data anggota terdaftar.
                        </td>
                      </tr>
                    ) : (
                      memberDuesStatuses.map((row, idx) => (
                        <tr key={row.member.id}>
                          <td className="p-2 border-r border-slate-200 text-center tabular-nums">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-200 font-mono font-bold tabular-nums">
                            {row.member.memberNumber}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-semibold">{row.member.fullName}</td>
                          <td className="p-2 border-r border-slate-200">{row.member.businessName}</td>
                          <td className="p-2 border-r border-slate-200">{row.member.kelurahan}</td>
                          <td className="p-2 border-r border-slate-200 text-center whitespace-nowrap tabular-nums">
                            {row.lastPaymentDate}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-bold">
                            <span className={row.isPaid ? 'text-teal-700' : 'text-amber-700'}>
                              {row.isPaid ? 'Lunas' : 'Belum'}
                            </span>
                          </td>
                          <td className="p-2 text-right font-bold tabular-nums">
                            {row.totalAmount > 0 ? row.totalAmount.toLocaleString('id-ID') : '0'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                    <tr>
                      <td colSpan={7} className="p-2 border-r border-slate-300 text-right">
                        TOTAL PENERIMAAN IURAN PERIODE INI
                      </td>
                      <td className="p-2 text-right text-teal-800 tabular-nums">
                        {formatRupiah(duesPeriodApprovedTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <table className="w-full text-left text-[11px] border border-slate-300">
                  <thead className="bg-slate-100 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300 text-center">No.</th>
                      <th className="p-2 border-r border-slate-300">No. Bukti</th>
                      <th className="p-2 border-r border-slate-300 text-center">Tanggal</th>
                      <th className="p-2 border-r border-slate-300">Nama Anggota / Usaha</th>
                      <th className="p-2 border-r border-slate-300">Keterangan</th>
                      <th className="p-2 border-r border-slate-300 text-center">Status</th>
                      <th className="p-2 text-right">Nominal (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {periodDuesTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-slate-500 italic">
                          Tidak ada transaksi iuran anggota untuk periode {duesPeriodLabel}.
                        </td>
                      </tr>
                    ) : (
                      periodDuesTransactions.map((tx, idx) => {
                        const matched = resolveTransactionMember(tx, members);
                        const memberDisplay = tx.memberName
                          ? `${tx.memberName}${matched?.businessName ? ` (${matched.businessName})` : ''}`
                          : matched
                            ? `${matched.fullName} (${matched.businessName})`
                            : '-';
                        return (
                          <tr key={tx.id}>
                            <td className="p-2 border-r border-slate-200 text-center tabular-nums">{idx + 1}</td>
                            <td className="p-2 border-r border-slate-200 font-mono font-bold tabular-nums">
                              {tx.transactionNumber}
                            </td>
                            <td className="p-2 border-r border-slate-200 text-center whitespace-nowrap tabular-nums">
                              {tx.date}
                            </td>
                            <td className="p-2 border-r border-slate-200 font-semibold">{memberDisplay}</td>
                            <td className="p-2 border-r border-slate-200">{tx.description}</td>
                            <td className="p-2 border-r border-slate-200 text-center capitalize">
                              {tx.approvalStatus}
                            </td>
                            <td className="p-2 text-right font-bold text-teal-700 tabular-nums">
                              {Number(tx.amount).toLocaleString('id-ID')}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                    <tr>
                      <td colSpan={6} className="p-2 border-r border-slate-300 text-right">
                        TOTAL PENERIMAAN IURAN PERIODE INI
                      </td>
                      <td className="p-2 text-right text-teal-800 tabular-nums">
                        {formatRupiah(duesPeriodApprovedTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}

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

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setDuesPrintModalOpen(false)}
                className="px-4 py-2.5 min-h-[42px] text-xs font-semibold text-stone-600 hover:bg-stone-200 rounded-xl cursor-pointer transition-colors"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={triggerPrintDocument}
                className="bg-stone-200 hover:bg-stone-300 text-stone-800 px-4 py-2.5 min-h-[42px] rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak</span>
              </button>
              <button
                type="button"
                disabled={isExportingDuesPdf}
                onClick={handleExportDuesPdf}
                className="bg-teal-700 hover:bg-teal-800 text-white px-5 py-2.5 min-h-[42px] rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-70"
              >
                <Download className="w-4 h-4" />
                {isExportingDuesPdf ? (
                  <InlineShimmer variant="dark" label="Membuat PDF Resmi" widthClass="w-24" />
                ) : (
                  <span>Download PDF Resmi</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
