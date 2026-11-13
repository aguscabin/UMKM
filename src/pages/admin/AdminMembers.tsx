import React, { useState, useMemo, useRef } from 'react';
import { Member, KELURAHAN_LIST, BusinessCategory } from '../../types';
import { dbService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { OFFICIAL_LOGO_URL } from '../../components/UmkmKuatLogo';
import { MemberCardModal } from '../../components/MemberCardModal';
import { compressImage } from '../../utils/image';
import { validateMemberInput, validateUploadedFile } from '../../utils/validation';
import {
  downloadExcelTemplate,
  parseExcelMembersFile,
  ExcelParseResult,
  DEFAULT_MEMBER_PHOTO_PLACEHOLDER,
  DEFAULT_PRODUCT_PHOTO_PLACEHOLDER,
} from '../../utils/excelImport';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Download,
  Printer,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  X,
  Phone,
  MapPin,
  Building2,
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
  Share2,
  Copy,
  Check,
  Camera,
  Upload,
  CreditCard,
  QrCode,
} from 'lucide-react';

interface AdminMembersProps {
  members: Member[];
  onRefresh: () => void;
  openAddModalInitially?: boolean;
}

export const AdminMembers: React.FC<AdminMembersProps> = ({
  members,
  onRefresh,
  openAddModalInitially = false,
}) => {
  const { profile, canManageMembers } = useAuth();
  const [search, setSearch] = useState('');
  const [filterKelurahan, setFilterKelurahan] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [modalOpen, setModalOpen] = useState(openAddModalInitially);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [duplicationWarning, setDuplicationWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Automatic KTA Card Modal state
  const [cardMember, setCardMember] = useState<Member | null>(null);

  // Share Link Modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Printable PDF Modal state
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Excel Bulk Import states
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importResult, setImportResult] = useState<ExcelParseResult | null>(null);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [isImportingBulk, setIsImportingBulk] = useState(false);
  const [importProgress, setImportProgress] = useState<{ saved: number; total: number } | null>(null);

  // File upload refs
  const memberPhotoRef = useRef<HTMLInputElement>(null);
  const productPhotoRef = useRef<HTMLInputElement>(null);

  // Form state
  const initialFormState: Omit<Member, 'id'> = {
    memberNumber: '',
    fullName: '',
    nik: '',
    phone: '',
    email: '',
    address: '',
    kelurahan: 'Babakan',
    status: 'aktif',
    joinDate: new Date().toISOString().split('T')[0],
    businessName: '',
    category: 'Kuliner',
    topProduct: '',
    businessAddress: '',
    businessPhone: '',
    memberPhoto: '',
    productPhoto: '',
    legalities: 'NIB, Sertifikat Halal',
    isPublicDirectory: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const [formData, setFormData] = useState<Omit<Member, 'id'>>(initialFormState);

  // Auto generate next unique member number
  const generateNextMemberNumber = () => {
    const year = new Date().getFullYear();
    const count = members.length + 1;
    const padded = String(count).padStart(3, '0');
    return `KUAT-TNG-${year}-${padded}`;
  };

  const handleOpenAdd = () => {
    setEditingMember(null);
    setDuplicationWarning(null);
    setFormData({
      ...initialFormState,
      memberNumber: generateNextMemberNumber(),
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    setDuplicationWarning(null);
    setFormData({
      memberNumber: m.memberNumber || '',
      fullName: m.fullName || '',
      nik: m.nik || '',
      phone: m.phone || '',
      email: m.email || '',
      address: m.address || '',
      kelurahan: m.kelurahan || 'Babakan',
      status: m.status || 'aktif',
      joinDate: m.joinDate || new Date().toISOString().split('T')[0],
      businessName: m.businessName || '',
      category: m.category || 'Kuliner',
      topProduct: m.topProduct || '',
      businessAddress: m.businessAddress || '',
      businessPhone: m.businessPhone || '',
      memberPhoto: m.memberPhoto || '',
      productPhoto: m.productPhoto || '',
      legalities: m.legalities || '',
      isPublicDirectory: m.isPublicDirectory ?? true,
      createdAt: m.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setModalOpen(true);
  };

  // Upload Photo handlers with file size/MIME check & compression
  const handleMemberPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileCheck = validateUploadedFile(file, 'image');
    if (!fileCheck.valid) {
      alert(fileCheck.error || 'File foto anggota tidak valid.');
      if (e.target) e.target.value = '';
      return;
    }
    try {
      const compressed = await compressImage(file, 500, 500, 0.82);
      setFormData((prev) => ({
        ...prev,
        memberPhoto: compressed,
      }));
    } catch (err: any) {
      alert('Gagal memproses foto anggota: ' + (err?.message || 'Format tidak didukung'));
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleProductPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileCheck = validateUploadedFile(file, 'image');
    if (!fileCheck.valid) {
      alert(fileCheck.error || 'File foto produk tidak valid.');
      if (e.target) e.target.value = '';
      return;
    }
    try {
      const compressed = await compressImage(file, 600, 600, 0.82);
      setFormData((prev) => ({
        ...prev,
        productPhoto: compressed,
      }));
    } catch (err: any) {
      alert('Gagal memproses foto produk: ' + (err?.message || 'Format tidak didukung'));
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Check duplication when NIK or Phone changes
  const checkDuplication = (nik: string, phone: string) => {
    if (nik && nik.trim() !== '') {
      const cleanNik = nik.trim();
      const duplicateNik = members.find(
        (m) => m.nik && m.nik.trim() === cleanNik && (!editingMember || m.id !== editingMember.id)
      );
      if (duplicateNik) {
        return `Peringatan: NIK ${cleanNik} sudah terdaftar atas nama ${duplicateNik.fullName} (${duplicateNik.memberNumber})`;
      }
    }

    if (phone && phone.trim() !== '') {
      const cleanPhone = phone.trim().replace(/\D/g, '');
      if (cleanPhone.length >= 8) {
        const duplicatePhone = members.find((m) => {
          if (!m.phone || (editingMember && m.id === editingMember.id)) return false;
          const existingCleanPhone = m.phone.trim().replace(/\D/g, '');
          return existingCleanPhone.length >= 8 && existingCleanPhone === cleanPhone;
        });
        if (duplicatePhone) {
          return `Peringatan: No WhatsApp/HP ${phone} sudah digunakan oleh anggota ${duplicatePhone.fullName} (${duplicatePhone.memberNumber})`;
        }
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validasi ketat & sanitasi XSS (NIK 16 digit, email, no WA/HP)
    const validation = validateMemberInput(formData, { requireValidNik: true });
    if (!validation.valid) {
      const msg = validation.errors[0] || 'Data anggota belum lengkap atau tidak valid.';
      setDuplicationWarning(msg);
      alert(msg);
      return;
    }

    const sanitized = validation.sanitized;

    // 2. Duplication check
    const dup = checkDuplication(sanitized.nik, sanitized.phone);
    if (dup) {
      setDuplicationWarning(dup);
      alert(dup);
      return;
    }

    try {
      setIsSubmitting(true);
      const id = editingMember ? editingMember.id : 'mem-' + Date.now();
      const memberToSave: Member = {
        ...sanitized,
        id,
        memberNumber: formData.memberNumber || sanitized.memberNumber,
        createdAt: editingMember ? editingMember.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dbService.saveMember(memberToSave);

      try {
        await dbService.addLog({
          userId: profile?.uid || 'admin',
          userName: profile?.displayName || 'Pengurus',
          action: editingMember ? 'Ubah Data Anggota' : 'Tambah Anggota Baru',
          target: memberToSave.memberNumber,
          details: `${memberToSave.fullName} - ${memberToSave.businessName} (Kel. ${memberToSave.kelurahan})`,
        });
      } catch (logErr) {
        console.warn('Logging non-fatal error:', logErr);
      }

      setModalOpen(false);
      onRefresh();

      // Show KTA Card
      setCardMember(memberToSave);
    } catch (err: any) {
      console.error('Error saving member:', err);
      alert('Gagal menyimpan data anggota: ' + (err?.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (m: Member) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data anggota ${m.fullName} (${m.memberNumber})?`)) {
      await dbService.deleteMember(m.id);
      await dbService.addLog({
        userId: profile?.uid || 'admin',
        userName: profile?.displayName || 'Pengurus',
        action: 'Hapus Anggota',
        target: m.memberNumber,
        details: `Menghapus anggota ${m.fullName}`,
      });
      onRefresh();
    }
  };

  const toggleStatus = async (m: Member) => {
    const newStatus = m.status === 'aktif' ? 'nonaktif' : 'aktif';
    const updated: Member = {
      ...m,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    await dbService.saveMember(updated);
    await dbService.addLog({
      userId: profile?.uid || 'admin',
      userName: profile?.displayName || 'Pengurus',
      action: 'Ubah Status Anggota',
      target: m.memberNumber,
      details: `Mengubah status keanggotaan ${m.fullName} menjadi ${newStatus}`,
    });
    onRefresh();
  };

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        search === '' ||
        m.fullName.toLowerCase().includes(search.toLowerCase()) ||
        m.memberNumber.toLowerCase().includes(search.toLowerCase()) ||
        m.nik.toLowerCase().includes(search.toLowerCase()) ||
        m.businessName.toLowerCase().includes(search.toLowerCase()) ||
        m.topProduct.toLowerCase().includes(search.toLowerCase());

      const matchKel = filterKelurahan === 'all' || m.kelurahan === filterKelurahan;
      const matchCat = filterCategory === 'all' || m.category === filterCategory;
      const matchStatus = filterStatus === 'all' || m.status === filterStatus;

      return matchSearch && matchKel && matchCat && matchStatus;
    });
  }, [members, search, filterKelurahan, filterCategory, filterStatus]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Nomor Anggota',
      'Nama Lengkap',
      'NIK',
      'Kelurahan',
      'WhatsApp',
      'Nama Usaha',
      'Kategori',
      'Produk Unggulan',
      'Legalitas',
      'Status',
      'Tampil di Direktori Publik',
      'Tanggal Bergabung',
    ];

    const rows = filteredMembers.map((m) => [
      `"${m.memberNumber}"`,
      `"${m.fullName}"`,
      `"'${m.nik}"`,
      `"${m.kelurahan}"`,
      `"${m.phone}"`,
      `"${m.businessName}"`,
      `"${m.category}"`,
      `"${m.topProduct}"`,
      `"${m.legalities || '-'}"`,
      `"${m.status}"`,
      `"${m.isPublicDirectory ? 'Ya' : 'Tidak'}"`,
      `"${m.joinDate}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Data_Anggota_UMKM_KUAT_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Registration Share Link
  const registrationLink = typeof window !== 'undefined' ? `${window.location.origin}/?tab=daftar` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(registrationLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Halo Pelaku UMKM Kecamatan Tangerang! 🌟\n\nYuk daftarkan usaha Anda di Forum UMKM KUAT Kecamatan Tangerang untuk mendapatkan pembinaan, sertifikasi Halal gratis, kemudahan NIB, dan akses bazar resmi!\n\nKlik link pendaftaran online resmi di sini:\n${registrationLink}\n\nMari bangkit dan KUAT bersama!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Excel Template & Import Handlers
  const handleDownloadTemplateExcel = () => {
    try {
      downloadExcelTemplate();
    } catch (err: any) {
      alert('Gagal membuat file template Excel: ' + (err?.message || 'Terjadi kesalahan'));
    }
  };

  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileCheck = validateUploadedFile(file, 'excel');
    if (!fileCheck.valid) {
      alert(fileCheck.error || 'File spreadsheet tidak valid.');
      if (e.target) e.target.value = '';
      return;
    }
    try {
      setIsParsingExcel(true);
      setImportFileName(file.name);
      const parsed = await parseExcelMembersFile(file, members);
      setImportResult(parsed);
      setImportModalOpen(true);
    } catch (err: any) {
      alert('Gagal membaca file Excel: ' + (err?.message || 'Pastikan format file (.xlsx, .xls, .csv) valid'));
    } finally {
      setIsParsingExcel(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleConfirmBulkImport = async () => {
    if (!importResult) return;
    const validRows = importResult.rows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert('Tidak ada data anggota yang valid untuk disimpan.');
      return;
    }

    try {
      setIsImportingBulk(true);
      const year = new Date().getFullYear();

      // Hitung nomor urut tertinggi untuk tahun berjalan agar tidak bentrok
      let maxSeq = 0;
      const prefix = `KUAT-TNG-${year}-`;
      for (const m of members) {
        if (m.memberNumber && m.memberNumber.startsWith(prefix)) {
          const tail = parseInt(m.memberNumber.slice(prefix.length), 10);
          if (!isNaN(tail) && tail > maxSeq) maxSeq = tail;
        }
      }
      if (maxSeq < members.length) {
        maxSeq = members.length;
      }

      const nowIso = new Date().toISOString();
      const baseTs = Date.now();

      const membersToSave: Member[] = validRows.map((row, idx) => {
        const seq = String(maxSeq + idx + 1).padStart(3, '0');
        return {
          id: `mem-${baseTs}-${idx}`,
          memberNumber: `${prefix}${seq}`,
          ...row.data,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
      });

      setImportProgress({ saved: 0, total: membersToSave.length });
      await dbService.saveMembersBulk(membersToSave, (saved, total) => {
        setImportProgress({ saved, total });
      });

      try {
        await dbService.addLog({
          userId: profile?.uid || 'admin',
          userName: profile?.displayName || 'Pengurus',
          action: 'Import Massal Excel Anggota',
          target: `${membersToSave.length} Anggota Baru`,
          details: `Import dari file "${importFileName}" (${membersToSave.length} berhasil, ${importResult.invalidCount} dilewati)`,
        });
      } catch (logErr) {
        console.warn('Logging non-fatal error:', logErr);
      }

      setImportModalOpen(false);
      setImportResult(null);
      setImportProgress(null);
      onRefresh();
      alert(`Berhasil mengimpor ${membersToSave.length} data anggota UMKM ke database!`);
    } catch (err: any) {
      console.error('Bulk import failed:', err);
      alert('Gagal menyimpan data import ke database: ' + (err?.message || 'Silakan periksa koneksi atau izin akses'));
    } finally {
      setIsImportingBulk(false);
      setImportProgress(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Data Keanggotaan UMKM
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Total {members.length} anggota terdaftar di 8 kelurahan se-Kecamatan Tangerang.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Share Link Pendaftaran */}
          <button
            onClick={() => setShareModalOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:from-orange-700 active:to-orange-800 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer min-h-[42px]"
          >
            <Share2 className="w-4 h-4" />
            <span>Bagikan Link</span>
          </button>

          {canManageMembers && (
            <>
              <button
                type="button"
                onClick={handleDownloadTemplateExcel}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-white hover:bg-emerald-50 active:bg-emerald-100 text-emerald-700 px-3.5 py-2.5 rounded-xl border border-emerald-200 text-xs font-bold shadow-2xs transition-colors cursor-pointer min-h-[42px]"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Download Template Excel</span>
              </button>

              <button
                type="button"
                disabled={isParsingExcel}
                onClick={() => excelInputRef.current?.click()}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer min-h-[42px] disabled:opacity-60"
              >
                <Upload className="w-4 h-4" />
                <span>{isParsingExcel ? 'Membaca Excel...' : 'Import Excel'}</span>
              </button>
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelFileChange}
                className="hidden"
              />
            </>
          )}

          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold shadow-2xs transition-colors cursor-pointer min-h-[42px]"
          >
            <Download className="w-4 h-4 text-teal-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={() => setPrintModalOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold shadow-2xs transition-colors cursor-pointer min-h-[42px]"
          >
            <Printer className="w-4 h-4 text-teal-600" />
            <span>Cetak PDF</span>
          </button>

          {canManageMembers && (
            <button
              onClick={handleOpenAdd}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Anggota Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, NIK, usaha..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500"
            />
          </div>

          {/* Kelurahan */}
          <div>
            <select
              value={filterKelurahan}
              onChange={(e) => setFilterKelurahan(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500 text-slate-700 font-medium"
            >
              <option value="all">Semua Kelurahan</option>
              {KELURAHAN_LIST.map((k) => (
                <option key={k} value={k}>
                  Kelurahan {k}
                </option>
              ))}
            </select>
          </div>

          {/* Kategori */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500 text-slate-700 font-medium"
            >
              <option value="all">Semua Kategori</option>
              <option value="Kuliner">Kuliner</option>
              <option value="Fashion & Tekstil">Fashion & Tekstil</option>
              <option value="Kriya & Kerajinan">Kriya & Kerajinan</option>
              <option value="Jasa & Konsultasi">Jasa & Konsultasi</option>
              <option value="Pertanian & Agro">Pertanian & Agro</option>
              <option value="Kesehatan & Kecantikan">Kesehatan & Kecantikan</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500 text-slate-700 font-medium"
            >
              <option value="all">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Results summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>Menampilkan <strong>{filteredMembers.length}</strong> dari {members.length} data anggota</span>
          {(search || filterKelurahan !== 'all' || filterCategory !== 'all' || filterStatus !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setFilterKelurahan('all');
                setFilterCategory('all');
                setFilterStatus('all');
              }}
              className="text-orange-600 hover:underline font-semibold cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* 1. MOBILE CARD VIEW (Khusus Layar HP / Smartphone - Tombol Besar & Responsif) */}
      <div className="block md:hidden space-y-3">
        {filteredMembers.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2.5">
            <div className="h-12 w-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <div className="font-bold text-slate-800 text-sm">Belum Ada Data Anggota</div>
            <p className="text-xs text-slate-500">
              {members.length === 0
                ? 'Basis data keanggotaan masih kosong. Daftarkan anggota baru di atas.'
                : 'Tidak ada data anggota yang sesuai kriteria pencarian.'}
            </p>
            {members.length === 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer min-h-[44px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Daftarkan Anggota Pertama</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredMembers.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-3.5 transition-all"
            >
              {/* Header Anggota HP */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center shadow-2xs">
                    {m.memberPhoto ? (
                      <img src={m.memberPhoto} alt={m.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-black text-teal-700 text-base">
                        {m.fullName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm truncate leading-snug">
                      {m.fullName}
                    </h4>
                    <div className="text-[11px] font-mono font-bold text-teal-700">
                      {m.memberNumber}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      Kel. {m.kelurahan}
                    </div>
                  </div>
                </div>

                {/* Status Toggle Badge */}
                <button
                  type="button"
                  onClick={() => toggleStatus(m)}
                  title="Klik untuk mengubah status"
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer flex-shrink-0 transition-colors ${
                    m.status === 'aktif'
                      ? 'bg-green-100 text-green-800 active:bg-green-200'
                      : m.status === 'pending'
                      ? 'bg-amber-100 text-amber-800 active:bg-amber-200'
                      : 'bg-red-100 text-red-800 active:bg-red-200'
                  }`}
                >
                  {m.status.toUpperCase()}
                </button>
              </div>

              {/* Data Usaha & Kontak */}
              <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 border border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                    <span className="truncate">{m.businessName}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 flex-shrink-0">
                    {m.category}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600">
                  <span className="text-slate-400 font-medium">Produk:</span> {m.topProduct}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="font-mono">WA: {m.phone}</span>
                  {m.phone && (
                    <a
                      href={`https://wa.me/${m.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Chat WA</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Action Buttons HP - Ukuran Sentuh Responsif (Touch-Friendly) */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                {canManageMembers && (
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(m)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 transition-colors cursor-pointer min-h-[44px]"
                  >
                    <Edit2 className="w-4 h-4 text-blue-600" />
                    <span>Ubah Data</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setCardMember(m)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-teal-50 hover:bg-teal-100 active:bg-teal-200 text-teal-800 rounded-xl text-xs font-bold border border-teal-200 transition-colors cursor-pointer min-h-[44px]"
                >
                  <CreditCard className="w-4 h-4 text-teal-600" />
                  <span>Cetak KTA</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingMember(m)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer min-h-[42px]"
                >
                  <Eye className="w-4 h-4 text-slate-600" />
                  <span>Lihat Detail</span>
                </button>

                {canManageMembers && (
                  <button
                    type="button"
                    onClick={() => handleDelete(m)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 rounded-xl text-xs font-semibold border border-red-200 transition-colors cursor-pointer min-h-[42px]"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 2. DESKTOP TABLE VIEW (Layar Komputer / Tablet) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">No. Anggota</th>
                <th className="px-4 py-3.5">Foto & Nama</th>
                <th className="px-4 py-3.5">Nama Usaha & Produk</th>
                <th className="px-4 py-3.5">Kelurahan</th>
                <th className="px-4 py-3.5">Legalitas</th>
                <th className="px-4 py-3.5 text-center">Publik</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Aksi & KTA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2.5">
                      <div className="h-12 w-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="font-bold text-slate-800 text-sm">Belum Ada Data Anggota</div>
                      <p className="text-xs text-slate-500">
                        {members.length === 0
                          ? 'Basis data keanggotaan masih kosong. Silakan daftarkan anggota baru atau bagikan link pendaftaran.'
                          : 'Tidak ada data anggota yang sesuai kriteria pencarian.'}
                      </p>
                      {members.length === 0 && (
                        <div className="pt-2">
                          <button
                            onClick={handleOpenAdd}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Daftarkan Anggota Pertama</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {m.memberNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                          {m.memberPhoto ? (
                            <img src={m.memberPhoto} alt={m.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-teal-700 text-xs">
                              {m.fullName.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{m.fullName}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <span>WA: {m.phone}</span>
                            <span>&bull;</span>
                            <span className="font-mono">NIK: {m.nik}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800 line-clamp-1">{m.businessName}</div>
                      <div className="text-[11px] text-teal-600 font-medium">
                        {m.category} &bull; {m.topProduct}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-medium text-slate-700">Kel. {m.kelurahan}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block max-w-[150px] truncate text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {m.legalities || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {m.isPublicDirectory ? (
                        <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded">
                          Tampil
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded">
                          Privat
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => toggleStatus(m)}
                        title="Klik untuk ubah status"
                        className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                          m.status === 'aktif'
                            ? 'bg-green-100 text-green-800'
                            : m.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {m.status.toUpperCase()}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Tombol Cetak KTA */}
                        <button
                          onClick={() => setCardMember(m)}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-bold flex items-center gap-1 border border-teal-200 cursor-pointer shadow-2xs transition-colors"
                          title="Pratinjau & Cetak Kartu Tanda Anggota (KTA)"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                          <span>Cetak KTA</span>
                        </button>

                        <button
                          onClick={() => setViewingMember(m)}
                          className="p-1.5 text-slate-500 hover:text-teal-600 rounded-lg hover:bg-teal-50"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canManageMembers && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(m)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                              title="Ubah Data"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(m)}
                              className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL SHARE LINK PENDAFTARAN ANGGOTA */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-white" />
                <h3 className="font-black text-base">Bagikan Link Pendaftaran UMKM</h3>
              </div>
              <button
                onClick={() => setShareModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-center">
              <div className="h-16 w-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                <Users className="w-8 h-8" />
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-base">Formulir Pendaftaran Anggota Baru</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Bagikan tautan ini ke grup WhatsApp RT/RW, kelurahan, dan media sosial agar pelaku UMKM dapat mendaftar mandiri.
                </p>
              </div>

              {/* Link Input Box */}
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <input
                  type="text"
                  readOnly
                  value={registrationLink}
                  className="bg-transparent text-xs text-slate-700 w-full font-mono outline-hidden"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer flex-shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleShareWhatsApp}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>Kirim Langsung ke WhatsApp</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-400">
              Setiap pendaftar akan otomatis memperoleh Nomor Anggota & Kartu KTA.
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL (TAMBAH / UBAH ANGGOTA LENGKAP DENGAN UPLOAD FOTO ANGGOTA & FOTO PRODUK) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[94vh] sm:max-h-[90vh] flex flex-col">
            <form onSubmit={handleSubmit} noValidate className="flex flex-col h-full min-h-0 flex-1 overflow-hidden">
              {/* Header Tetap di Atas (Pinned Header) */}
              <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 flex-shrink-0">
                <div>
                  <h3 className="font-black text-slate-900 text-base sm:text-lg">
                    {editingMember ? 'Ubah Data Anggota UMKM' : 'Pendaftaran Anggota UMKM Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Nomor Anggota: <span className="font-mono font-bold text-teal-700">{formData.memberNumber}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                  aria-label="Tutup Formulir"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Isi Formulir yang Bisa Di-scroll */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
                {duplicationWarning && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{duplicationWarning}</span>
                  </div>
                )}

                {/* UPLOAD FOTO ANGGOTA (UNTUK KARTU TANDA ANGGOTA KTA) */}
                <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-20 h-24 rounded-xl overflow-hidden bg-white border-2 border-teal-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                    {formData.memberPhoto ? (
                      <img src={formData.memberPhoto} alt="Foto Anggota" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-teal-600 p-2">
                        <Camera className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-[9px] font-bold">Pas Foto</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-center sm:text-left flex-1">
                    <div className="text-xs font-bold text-teal-900 flex items-center justify-center sm:justify-start gap-1.5">
                      <span>Foto Anggota (Tampil di Kartu KTA Resmi)</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Upload pas foto anggota atau foto selfie wajah. Format JPG/PNG (Maks. 5MB).
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => memberPhotoRef.current?.click()}
                        className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer min-h-[40px] shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{formData.memberPhoto ? 'Ganti Foto' : 'Upload Pas Foto'}</span>
                      </button>
                      {formData.memberPhoto && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, memberPhoto: '' })}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-xl text-xs font-semibold cursor-pointer min-h-[40px]"
                        >
                          Hapus
                        </button>
                      )}
                      <input
                        ref={memberPhotoRef}
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={handleMemberPhotoUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* SEKSI 1: DATA PRIBADI ANGGOTA */}
                <div className="space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg">
                    1. Data Pribadi Anggota
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama Lengkap Sesuai KTP <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Nama lengkap sesuai KTP"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        NIK (Nomor Induk Kependudukan) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        maxLength={16}
                        value={formData.nik}
                        onChange={(e) => {
                          setDuplicationWarning(null);
                          setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '') });
                        }}
                        placeholder="16 digit NIK Kota Tangerang"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        No. WhatsApp / HP <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        inputMode="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => {
                          setDuplicationWarning(null);
                          setFormData({ ...formData, phone: e.target.value });
                        }}
                        placeholder="081234567890"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@gmail.com"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Kelurahan <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.kelurahan}
                        onChange={(e) => setFormData({ ...formData, kelurahan: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500 font-medium"
                      >
                        {KELURAHAN_LIST.map((k) => (
                          <option key={k} value={k}>
                            Kelurahan {k}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Alamat Domisili KTP <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Jl. RT/RW Kelurahan..."
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* SEKSI 2: DATA USAHA & PRODUK */}
                <div className="space-y-4 pt-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-orange-800 bg-orange-50 px-3 py-1.5 rounded-lg">
                    2. Data Usaha & Produk
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama Usaha / Merk <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        placeholder="Contoh: Dapur Kue Mak Rohmah"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Kategori Usaha <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500 font-medium"
                      >
                        <option value="Kuliner">Kuliner</option>
                        <option value="Fashion & Tekstil">Fashion & Tekstil</option>
                        <option value="Kriya & Kerajinan">Kriya & Kerajinan</option>
                        <option value="Jasa & Konsultasi">Jasa & Konsultasi</option>
                        <option value="Perdagangan & Toko">Perdagangan & Toko</option>
                        <option value="Pertanian & Agro">Pertanian & Agro</option>
                        <option value="Kesehatan & Kecantikan">Kesehatan & Kecantikan</option>
                        <option value="Teknologi & Digital">Teknologi & Digital</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Produk Unggulan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.topProduct}
                        onChange={(e) => setFormData({ ...formData, topProduct: e.target.value })}
                        placeholder="Contoh: Kue Cucur Pandan & Tumpeng Mini"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        No. Kontak WhatsApp Usaha
                      </label>
                      <input
                        type="tel"
                        inputMode="tel"
                        value={formData.businessPhone}
                        onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                        placeholder="0812..."
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Alamat Usaha / Toko
                    </label>
                    <input
                      type="text"
                      value={formData.businessAddress}
                      onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                      placeholder="Alamat tempat produksi / toko offline"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Legalitas Yang Dimiliki
                      </label>
                      <input
                        type="text"
                        value={formData.legalities}
                        onChange={(e) => setFormData({ ...formData, legalities: e.target.value })}
                        placeholder="NIB, Sertifikat Halal, P-IRT, dsb."
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Upload Foto Produk
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => productPhotoRef.current?.click()}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                        >
                          <Camera className="w-4 h-4 text-teal-600" />
                          <span>{formData.productPhoto ? 'Foto Terpilih' : 'Pilih Foto'}</span>
                        </button>
                        <input
                          ref={productPhotoRef}
                          type="file"
                          accept="image/*"
                          onChange={handleProductPhotoUpload}
                          className="hidden"
                        />
                        {formData.productPhoto && (
                          <img
                            src={formData.productPhoto}
                            alt="Produk"
                            className="h-9 w-9 object-cover rounded-lg border border-slate-300 shadow-2xs"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SEKSI 3: PENGATURAN PRIVASI & STATUS */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          Tampilkan di Katalog Direktori Publik?
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Hanya data usaha yang disetujui yang akan muncul di website publik (NIK dan data pribadi tetap rahasia).
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isPublicDirectory}
                          onChange={(e) => setFormData({ ...formData, isPublicDirectory: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className="text-xs font-bold text-slate-800">Status Keanggotaan</span>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="px-3.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-bold"
                      >
                        <option value="aktif">Aktif</option>
                        <option value="pending">Pending</option>
                        <option value="nonaktif">Nonaktif</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tombol Simpan Perubahan - Selalu Menempel di Bawah (Pinned Footer) */}
              <div className="p-3.5 sm:p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 flex-shrink-0 shadow-xs">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-60 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingMember ? 'Simpan Perubahan' : 'Daftarkan & Terbitkan KTA'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL VIEW MODAL */}
      {viewingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-mono font-bold text-teal-700 text-xs">
                {viewingMember.memberNumber}
              </span>
              <button
                onClick={() => setViewingMember(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-teal-50 border border-teal-200 overflow-hidden flex items-center justify-center text-teal-700 font-black text-xl flex-shrink-0">
                  {viewingMember.memberPhoto ? (
                    <img src={viewingMember.memberPhoto} alt={viewingMember.fullName} className="w-full h-full object-cover" />
                  ) : (
                    viewingMember.fullName.charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{viewingMember.fullName}</h3>
                  <div className="text-xs text-slate-500 font-mono">NIK: {viewingMember.nik}</div>
                  <div className="text-xs text-teal-700 font-semibold mt-0.5">
                    Kelurahan {viewingMember.kelurahan} &bull; Status: {viewingMember.status.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-semibold">Nama Usaha:</span>
                  <div className="font-bold text-slate-800">{viewingMember.businessName}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Kategori:</span>
                  <div className="font-bold text-slate-800">{viewingMember.category}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Produk Unggulan:</span>
                  <div className="text-slate-800">{viewingMember.topProduct}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">No. Kontak / WA:</span>
                  <div className="font-mono text-slate-800">{viewingMember.phone}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 font-semibold">Alamat Usaha:</span>
                  <div className="text-slate-800">{viewingMember.businessAddress || viewingMember.address}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 font-semibold">Legalitas:</span>
                  <div className="text-teal-700 font-semibold">{viewingMember.legalities || '-'}</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const m = viewingMember;
                    setViewingMember(null);
                    setCardMember(m);
                  }}
                  className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer min-h-[42px] transition-colors"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Buka Kartu KTA</span>
                </button>
                {canManageMembers && (
                  <button
                    type="button"
                    onClick={() => {
                      const m = viewingMember;
                      setViewingMember(null);
                      handleOpenEdit(m);
                    }}
                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer min-h-[42px] transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Ubah Data</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setViewingMember(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer min-h-[42px] transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED PRINTABLE PDF MODAL FOR REKAPITULASI KEANGGOTAAN */}
      {printModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-teal-400" />
                <span className="font-bold text-sm">Pratinjau Cetak PDF Daftar Keanggotaan</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
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
              {/* Kop Surat Resmi */}
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
                  DAFTAR REKAPITULASI KEANGGOTAAN RESMI
                </h2>
                <div className="text-xs text-slate-500 font-semibold">
                  Total {filteredMembers.length} Anggota Binaan Terverifikasi &bull; Dicetak:{' '}
                  {new Date().toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-left text-[11px] border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300">No.</th>
                    <th className="p-2 border-r border-slate-300">No. Anggota</th>
                    <th className="p-2 border-r border-slate-300">Nama Lengkap</th>
                    <th className="p-2 border-r border-slate-300">NIK</th>
                    <th className="p-2 border-r border-slate-300">Kelurahan</th>
                    <th className="p-2 border-r border-slate-300">Nama Usaha & Produk</th>
                    <th className="p-2 border-r border-slate-300">Kategori</th>
                    <th className="p-2 border-r border-slate-300">WhatsApp</th>
                    <th className="p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredMembers.map((m, idx) => (
                    <tr key={m.id}>
                      <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-mono font-bold">{m.memberNumber}</td>
                      <td className="p-2 border-r border-slate-200 font-semibold">{m.fullName}</td>
                      <td className="p-2 border-r border-slate-200 font-mono">{m.nik}</td>
                      <td className="p-2 border-r border-slate-200">Kel. {m.kelurahan}</td>
                      <td className="p-2 border-r border-slate-200">
                        <strong>{m.businessName}</strong> ({m.topProduct})
                      </td>
                      <td className="p-2 border-r border-slate-200">{m.category}</td>
                      <td className="p-2 border-r border-slate-200 font-mono">{m.phone}</td>
                      <td className="p-2 text-center font-bold text-teal-700 capitalize">{m.status}</td>
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
                    <div className="font-bold">Sekretaris Forum</div>
                  </div>
                  <div className="font-bold underline">DIna Fatrian S.I.Kom</div>
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
                onClick={() => window.print()}
                className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Dokumen Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRATINJAU & VALIDASI IMPORT EXCEL */}
      {importModalOpen && importResult && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full sm:max-w-6xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[94vh] sm:max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-slate-900 text-base sm:text-lg truncate">
                    Pratinjau Import Data Anggota Excel
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">
                    File: <span className="font-semibold text-slate-700">{importFileName}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isImportingBulk}
                onClick={() => setImportModalOpen(false)}
                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                aria-label="Tutup Modal Import"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500">Total Baris Terbaca</div>
                    <div className="text-xl font-black text-slate-900">{importResult.rows.length}</div>
                  </div>
                  <Users className="w-6 h-6 text-slate-400" />
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-semibold text-emerald-700">Valid & Siap Disimpan</div>
                    <div className="text-xl font-black text-emerald-800">{importResult.validCount}</div>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>

                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-semibold text-red-700">Error / Duplikat (Dilewati)</div>
                    <div className="text-xl font-black text-red-800">{importResult.invalidCount}</div>
                  </div>
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
              </div>

              {/* Missing Headers Alert */}
              {importResult.missingHeaders.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <div className="font-bold">Beberapa kolom template tidak ditemukan pada header Excel:</div>
                    <div className="mt-0.5 text-[11px] font-mono">
                      {importResult.missingHeaders.join(', ')}
                    </div>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {importResult.rows.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                  Tidak ada baris data anggota yang ditemukan di bawah baris header.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto max-h-[46vh]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-3">Baris</th>
                          <th className="px-3 py-3">Status Validasi</th>
                          <th className="px-3 py-3">Foto</th>
                          <th className="px-3 py-3">Nama & Domisili</th>
                          <th className="px-3 py-3">NIK (Teks)</th>
                          <th className="px-3 py-3">No. WA / Email</th>
                          <th className="px-3 py-3">Usaha & Produk</th>
                          <th className="px-3 py-3">Legalitas</th>
                          <th className="px-3 py-3">Produk</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {importResult.rows.map((row) => (
                          <tr
                            key={row.rowNumber}
                            className={row.isValid ? 'hover:bg-slate-50/80' : 'bg-red-50/40 hover:bg-red-50/70'}
                          >
                            <td className="px-3 py-2.5 font-mono text-slate-500 font-semibold whitespace-nowrap">
                              #{row.rowNumber}
                            </td>
                            <td className="px-3 py-2.5 min-w-[170px]">
                              {row.isValid ? (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Valid
                                  </span>
                                  {row.warnings.length > 0 && (
                                    <div className="text-[10px] text-amber-700 leading-tight">
                                      {row.warnings.join('; ')}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-[10px] font-bold">
                                    <AlertTriangle className="w-3 h-3" />
                                    Tidak Valid
                                  </span>
                                  <div className="text-[10px] text-red-700 font-medium leading-tight">
                                    {row.errors.join('; ')}
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              <img
                                src={row.data.memberPhoto}
                                alt={row.data.fullName || 'Foto'}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = DEFAULT_MEMBER_PHOTO_PLACEHOLDER;
                                }}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-slate-100"
                              />
                            </td>
                            <td className="px-3 py-2.5 min-w-[160px]">
                              <div className="font-bold text-slate-900">
                                {row.data.fullName || <span className="text-red-500 italic">(Kosong)</span>}
                              </div>
                              <div className="text-[10px] text-teal-700 font-semibold">
                                Kel. {row.data.kelurahan}
                              </div>
                              <div className="text-[10px] text-slate-500 line-clamp-1" title={row.data.address}>
                                {row.data.address}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 font-mono text-[11px] font-semibold text-slate-800 whitespace-nowrap">
                              {row.data.nik || <span className="text-red-500 italic">(Kosong)</span>}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <div className="font-mono text-[11px] font-semibold text-slate-800">
                                {row.data.phone || <span className="text-red-500 italic">(Kosong)</span>}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                                {row.data.email || '-'}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 min-w-[160px]">
                              <div className="font-bold text-slate-800">
                                {row.data.businessName || <span className="text-red-500 italic">(Kosong)</span>}
                              </div>
                              <div className="text-[10px] text-teal-700 font-medium">
                                {row.data.category} &bull; {row.data.topProduct}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                WA Usaha: {row.data.businessPhone || '-'}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 max-w-[130px]">
                              <span className="text-[10px] text-slate-600 line-clamp-2">
                                {row.data.legalities || '-'}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <img
                                src={row.data.productPhoto}
                                alt={row.data.businessName || 'Produk'}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_PHOTO_PLACEHOLDER;
                                }}
                                className="w-12 h-10 rounded-xl object-cover border border-slate-200 bg-slate-100"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 flex-shrink-0">
              <div className="text-[11px] text-slate-500 text-center sm:text-left">
                {importResult.invalidCount > 0 ? (
                  <span>
                    Baris berstatus <strong>Tidak Valid</strong> tidak akan ikut disimpan. Hanya{' '}
                    <strong className="text-emerald-700">{importResult.validCount} data valid</strong> yang disimpan.
                  </span>
                ) : (
                  <span>Semua tautan Google Drive otomatis dikonversi ke format gambar langsung.</span>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={isImportingBulk}
                  onClick={() => setImportModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isImportingBulk || importResult.validCount === 0}
                  onClick={handleConfirmBulkImport}
                  className="w-full sm:w-auto px-6 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isImportingBulk ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>
                        Menyimpan ({importProgress?.saved ?? 0}/{importProgress?.total ?? importResult.validCount})...
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan Semua ke Database ({importResult.validCount})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUTOMATIC MEMBER CARD MODAL (KTA) */}
      {cardMember && (
        <MemberCardModal
          member={cardMember}
          onClose={() => setCardMember(null)}
        />
      )}
    </div>
  );
};
