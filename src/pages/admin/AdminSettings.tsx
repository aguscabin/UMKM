import React, { useState, useEffect, useRef } from 'react';
import { ActivityLog, UserRole, OrgStructureMember, OrgVisionMission, OrgContactInfo, UserProfile } from '../../types';
import { dbService, INITIAL_ORG_STRUCTURE, INITIAL_VISION_MISSION, INITIAL_CONTACT_INFO, INITIAL_USERS } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { compressImage } from '../../utils/image';
import {
  Settings,
  ShieldCheck,
  UserCheck,
  Database,
  Download,
  Upload,
  RefreshCw,
  Clock,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  Users2,
  Edit3,
  Plus,
  Trash2,
  Camera,
  Image as ImageIcon,
  Check,
  X,
  Sparkles,
  Award,
  Target,
  Compass,
  ChevronUp,
  ChevronDown,
  Save,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Globe,
  ExternalLink,
  UserPlus,
} from 'lucide-react';

interface AdminSettingsProps {
  logs: ActivityLog[];
  onRefreshAll: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ logs, onRefreshAll }) => {
  const { profile, simulateRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'struktur' | 'visimisi' | 'kontak' | 'rbac' | 'database' | 'logs'>('struktur');

  // Backup & restore state
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [clearStatus, setClearStatus] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  // Organization Structure State
  const [orgList, setOrgList] = useState<OrgStructureMember[]>(INITIAL_ORG_STRUCTURE);
  const [editingMember, setEditingMember] = useState<OrgStructureMember | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Vision & Mission State
  const [visionText, setVisionText] = useState(INITIAL_VISION_MISSION.vision);
  const [missionsList, setMissionsList] = useState<string[]>(INITIAL_VISION_MISSION.missions);
  const [newMissionInput, setNewMissionInput] = useState('');
  const [isSavingVisionMission, setIsSavingVisionMission] = useState(false);
  const [visionMissionSuccess, setVisionMissionSuccess] = useState<string | null>(null);

  // Contact & Services State
  const [contactForm, setContactForm] = useState<OrgContactInfo>(INITIAL_CONTACT_INFO);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);

  // User Management & RBAC Role Assignment State
  const [userList, setUserList] = useState<UserProfile[]>(INITIAL_USERS);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);

  // Load org structure, vision/mission, contact info, and users
  useEffect(() => {
    loadOrgStructure();
    loadVisionMission();
    loadContactInfo();
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await dbService.getUsers();
      if (data && data.length > 0) {
        setUserList(data);
      }
    } catch (err) {
      console.warn('Failed loading users:', err);
    }
  };

  const loadContactInfo = async () => {
    try {
      const data = await dbService.getContactInfo();
      if (data) {
        setContactForm(data);
      }
    } catch (err) {
      console.warn('Failed loading contact info:', err);
    }
  };

  const loadVisionMission = async () => {
    try {
      const data = await dbService.getVisionMission();
      if (data) {
        if (data.vision) setVisionText(data.vision);
        if (Array.isArray(data.missions) && data.missions.length > 0) {
          setMissionsList(data.missions);
        }
      }
    } catch (err) {
      console.warn('Failed loading vision & mission:', err);
    }
  };

  const loadOrgStructure = async () => {
    try {
      const data = await dbService.getOrgStructure();
      if (data && data.length > 0) {
        setOrgList(data);
      }
    } catch (err) {
      console.warn('Failed loading org structure:', err);
    }
  };

  // Clear all membership and financial data
  const handleClearAllData = async () => {
    if (confirm('PERINGATAN: Apakah Anda yakin ingin MENGOSONGKAN SELURUH DATA KEANGGOTAAN dan DATA KEUANGAN? Semua data anggota UMKM dan transaksi kas akan dihapus bersih.')) {
      setIsClearing(true);
      try {
        await dbService.clearAllMembersAndTransactions();
        await dbService.addLog({
          userId: profile?.uid || 'usr-admin',
          userName: profile?.displayName || 'Admin',
          action: 'Kosongkan Data Sistem',
          target: 'Keanggotaan & Keuangan',
          details: 'Mengosongkan semua data anggota dan riwayat transaksi kas',
        });
        onRefreshAll();
        setClearStatus('Seluruh data keanggotaan dan keuangan berhasil dikosongkan!');
        setTimeout(() => setClearStatus(null), 5000);
      } catch (e: any) {
        alert('Gagal mengosongkan data: ' + (e?.message || 'Terjadi kesalahan sistem'));
      } finally {
        setIsClearing(false);
      }
    }
  };

  // RBAC descriptions
  const rolesInfo: Array<{
    role: UserRole;
    name: string;
    description: string;
    permissions: string[];
  }> = [
    {
      role: 'super_admin',
      name: 'Super Admin',
      description: 'Pemegang kewenangan tertinggi sistem Forum UMKM KUAT.',
      permissions: ['Akses Semua Modul', 'Kelola Pengguna & Hak Akses', 'Buku Kas & Keuangan', 'Cadangkan & Pulihkan Database', 'Edit Struktur Organisasi'],
    },
    {
      role: 'pengurus_kecamatan',
      name: 'Pengurus Kecamatan',
      description: 'Unsur pimpinan eksekutif Forum tingkat Kecamatan Tangerang.',
      permissions: ['Dashboard Eksekutif', 'Melihat & Verifikasi Keanggotaan', 'Laporan Lengkap & Statistik', 'Publikasi Event Resmi'],
    },
    {
      role: 'admin_keanggotaan',
      name: 'Admin Keanggotaan',
      description: 'Petugas pendataan dan kurasi legalitas pelaku usaha UMKM.',
      permissions: ['Input & Edit Anggota Baru', 'Verifikasi Dokumen NIB & Halal', 'Kelola Direktori Publik', 'Ekspor Data Keanggotaan'],
    },
    {
      role: 'bendahara',
      name: 'Bendahara',
      description: 'Pengelola arus kas keuangan, iuran anggota, dan sponsor.',
      permissions: ['Pencatatan Pemasukan & Pengeluaran', 'Kelola Buku Kas Umum (BKU)', 'Rekap Iuran Bulanan Anggota', 'Ekspor Laporan Keuangan'],
    },
    {
      role: 'admin_informasi',
      name: 'Admin Informasi & Publikasi',
      description: 'Pengelola konten berita, edukasi wirausaha, dan agenda bazar.',
      permissions: ['Buat & Publikasikan Agenda Kegiatan', 'Tulis & Sunting Kabar Berita', 'Kelola Dokumentasi Bazar', 'Arsip Konten'],
    },
    {
      role: 'pengurus_kelurahan',
      name: 'Pengurus Kelurahan',
      description: 'Koordinator UMKM di salah satu dari 8 kelurahan.',
      permissions: ['Mendaftarkan UMKM di Wilayah Kelurahannya', 'Melihat Status Binaan Lokal', 'Akses Data Publik'],
    },
    {
      role: 'member',
      name: 'Member / Pendaftar',
      description: 'Peran standar bawaan seluruh pendaftar mandiri baru sesuai prinsip Least Privilege.',
      permissions: ['Pengisian Formulir Pendaftaran UMKM', 'Unggah Dokumen Usaha Mandiri', 'Lihat Status Registrasi & Cetak KTA', 'Dilarang Akses Panel Admin (Strict 403 Forbidden)'],
    },
  ];

  // Open modal to add or edit
  const handleOpenEdit = (member?: OrgStructureMember) => {
    if (member) {
      setEditingMember({ ...member });
    } else {
      setEditingMember({
        id: 'org-' + Date.now(),
        role: 'Pengurus',
        name: '',
        title: '',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        order: orgList.length + 1,
      });
    }
    setIsModalOpen(true);
  };

  // Handle Photo Upload with HTML5 Canvas compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingPhoto(true);
    try {
      // Compress to maximum 500x500 at 0.82 quality (~25KB-40KB)
      // Completely fits in Firestore (1MB limit) and LocalStorage (5MB quota)
      const compressedDataUrl = await compressImage(file, 500, 500, 0.82);
      setEditingMember((prev) => (prev ? { ...prev, image: compressedDataUrl } : null));
    } catch (err: any) {
      console.error('Image compression error:', err);
      alert('Gagal memproses foto: ' + (err?.message || 'Format gambar tidak didukung'));
    } finally {
      setIsCompressingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Save Org Member
  const handleSaveMember = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!editingMember) return;

    const trimmedName = (editingMember.name || '').trim();
    const trimmedRole = (editingMember.role || '').trim();

    if (!trimmedName) {
      alert('Mohon isi nama lengkap pengurus.');
      return;
    }
    if (!trimmedRole) {
      alert('Mohon isi jabatan atau posisi pengurus.');
      return;
    }

    setIsSavingOrg(true);
    try {
      const memberToSave: OrgStructureMember = {
        ...editingMember,
        name: trimmedName,
        role: trimmedRole,
        title: (editingMember.title || '').trim(),
        image: (editingMember.image || '').trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        order: Number(editingMember.order) || orgList.length + 1,
        updatedAt: new Date().toISOString(),
      };

      // 1. Persist to DB service (localStorage + Firestore)
      await dbService.saveOrgStructureMember(memberToSave);

      // 2. Immediately update local state so UI updates without any flicker or reversion
      setOrgList((prev) => {
        const idx = prev.findIndex((m) => m.id === memberToSave.id);
        let nextList: OrgStructureMember[];
        if (idx >= 0) {
          nextList = [...prev];
          nextList[idx] = memberToSave;
        } else {
          nextList = [...prev, memberToSave];
        }
        return nextList.sort((a, b) => a.order - b.order);
      });

      await dbService.addLog({
        userId: profile?.uid || 'usr-admin',
        userName: profile?.displayName || 'Admin',
        action: 'Perbarui Struktur Organisasi',
        target: memberToSave.name,
        details: `${memberToSave.role}: ${memberToSave.name} (${memberToSave.title})`,
      });

      setIsModalOpen(false);
      setEditingMember(null);
      onRefreshAll();
      setSaveSuccess(`Data & foto pengurus "${memberToSave.name}" (${memberToSave.role}) berhasil disimpan!`);
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      console.error('Error saving org member:', err);
      alert('Gagal menyimpan pengurus: ' + (err?.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsSavingOrg(false);
    }
  };

  // User Management Handlers (RBAC Role Assignment)
  const handleOpenUserEdit = (user?: UserProfile) => {
    if (user) {
      setEditingUser({ ...user });
    } else {
      setEditingUser({
        uid: 'usr-' + Date.now(),
        displayName: '',
        email: '',
        role: 'pengurus_kelurahan',
        kelurahan: 'Babakan',
        createdAt: new Date().toISOString(),
      });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!editingUser) return;

    const trimmedName = (editingUser.displayName || '').trim();
    const trimmedEmail = (editingUser.email || '').trim().toLowerCase();

    if (!trimmedName) {
      alert('Mohon isi nama lengkap pengguna / pengurus.');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      alert('Mohon masukkan alamat email akun yang valid.');
      return;
    }

    setIsSavingUser(true);
    try {
      const userToSave: UserProfile = {
        ...editingUser,
        displayName: trimmedName,
        email: trimmedEmail,
        updatedAt: new Date().toISOString(),
      };

      await dbService.saveUserProfile(userToSave);

      // Update local state immediately
      setUserList((prev) => {
        const idx = prev.findIndex((u) => u.uid === userToSave.uid);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = userToSave;
          return copy;
        }
        return [...prev, userToSave];
      });

      await dbService.addLog({
        userId: profile?.uid || 'usr-admin',
        userName: profile?.displayName || 'Admin',
        action: 'Perbarui Hak Akses Pengguna',
        target: userToSave.email,
        details: `Mengubah hak akses akun ${userToSave.displayName} menjadi peran: ${userToSave.role} (${userToSave.kelurahan || 'Kecamatan'})`,
      });

      setIsUserModalOpen(false);
      setEditingUser(null);
      setUserSuccess(`Hak akses untuk ${userToSave.displayName} (${userToSave.role.replace('_', ' ')}) berhasil disimpan!`);
      setTimeout(() => setUserSuccess(null), 4000);
      onRefreshAll();
    } catch (err: any) {
      console.error('Error saving user role:', err);
      alert('Gagal menyimpan hak akses: ' + (err?.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (user.role === 'super_admin' && userList.filter((u) => u.role === 'super_admin').length <= 1) {
      alert('Tidak dapat menghapus Super Admin terakhir sistem.');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus akses akun ${user.displayName} (${user.email})?`)) {
      await dbService.deleteUserProfile(user.uid);
      setUserList((prev) => prev.filter((u) => u.uid !== user.uid));
      await dbService.addLog({
        userId: profile?.uid || 'usr-admin',
        userName: profile?.displayName || 'Admin',
        action: 'Hapus Hak Akses Pengguna',
        target: user.email,
        details: `Menghapus akun ${user.displayName} (${user.role})`,
      });
      onRefreshAll();
    }
  };

  // Delete Org Member
  const handleDeleteMember = async (member: OrgStructureMember) => {
    if (confirm(`Apakah Anda yakin ingin menghapus "${member.name}" (${member.role}) dari struktur kepengurusan?`)) {
      await dbService.deleteOrgStructureMember(member.id);
      await dbService.addLog({
        userId: profile?.uid || 'usr-admin',
        userName: profile?.displayName || 'Admin',
        action: 'Hapus Pengurus Organisasi',
        target: member.name,
        details: `Menghapus ${member.role}: ${member.name}`,
      });
      await loadOrgStructure();
      onRefreshAll();
    }
  };

  // Reset to default 6 members
  const handleResetOrgStructure = async () => {
    if (confirm('Kembalikan struktur kepengurusan ke susunan resmi 6 pimpinan Forum UMKM KUAT?')) {
      for (const m of INITIAL_ORG_STRUCTURE) {
        await dbService.saveOrgStructureMember(m);
      }
      await loadOrgStructure();
      onRefreshAll();
      alert('Struktur organisasi berhasil dikembalikan ke susunan resmi!');
    }
  };

  // Visi & Misi Handlers
  const handleSaveVisionMission = async () => {
    const trimmedVision = visionText.trim();
    if (!trimmedVision) {
      alert('Visi organisasi tidak boleh kosong. Mohon tuliskan visi organisasi.');
      return;
    }
    const cleanMissions = missionsList.map((m) => m.trim()).filter((m) => m.length > 0);
    if (cleanMissions.length === 0) {
      alert('Misi organisasi harus memiliki minimal 1 poin kegiatan/tujuan.');
      return;
    }

    setIsSavingVisionMission(true);
    try {
      const payload: OrgVisionMission = {
        vision: trimmedVision,
        missions: cleanMissions,
      };

      await dbService.saveVisionMission(payload);
      await dbService.addLog({
        userId: profile?.uid || 'usr-admin',
        userName: profile?.displayName || 'Admin',
        action: 'Perbarui Visi & Misi',
        target: 'Profil Organisasi',
        details: `Memperbarui rumusan visi dan ${cleanMissions.length} poin misi Forum UMKM KUAT`,
      });

      setVisionText(trimmedVision);
      setMissionsList(cleanMissions);
      onRefreshAll();
      setVisionMissionSuccess('Visi dan Misi organisasi berhasil disimpan dan diperbarui di website publik!');
      setTimeout(() => setVisionMissionSuccess(null), 4000);
    } catch (err: any) {
      console.error('Error saving vision & mission:', err);
      alert('Gagal menyimpan Visi & Misi: ' + (err?.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsSavingVisionMission(false);
    }
  };

  const handleAddMission = () => {
    const trimmed = newMissionInput.trim();
    if (!trimmed) {
      alert('Mohon ketik teks poin misi terlebih dahulu.');
      return;
    }
    setMissionsList([...missionsList, trimmed]);
    setNewMissionInput('');
  };

  const handleUpdateMission = (index: number, val: string) => {
    const copy = [...missionsList];
    copy[index] = val;
    setMissionsList(copy);
  };

  const handleDeleteMission = (index: number) => {
    if (missionsList.length <= 1) {
      alert('Misi organisasi minimal harus memiliki 1 poin.');
      return;
    }
    if (confirm(`Hapus poin misi ke-${index + 1}?`)) {
      setMissionsList(missionsList.filter((_, idx) => idx !== index));
    }
  };

  const handleMoveMission = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= missionsList.length) return;
    const copy = [...missionsList];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setMissionsList(copy);
  };

  const handleResetVisionMission = async () => {
    if (confirm('Kembalikan rumusan Visi & Misi organisasi ke standar resmi Forum UMKM KUAT Kecamatan Tangerang?')) {
      setIsSavingVisionMission(true);
      try {
        await dbService.saveVisionMission(INITIAL_VISION_MISSION);
        await dbService.addLog({
          userId: profile?.uid || 'usr-admin',
          userName: profile?.displayName || 'Admin',
          action: 'Reset Visi & Misi',
          target: 'Profil Organisasi',
          details: 'Mengembalikan Visi dan Misi ke susunan resmi Forum UMKM KUAT',
        });
        setVisionText(INITIAL_VISION_MISSION.vision);
        setMissionsList(INITIAL_VISION_MISSION.missions);
        onRefreshAll();
        setVisionMissionSuccess('Visi dan Misi organisasi berhasil dikembalikan ke standar resmi!');
        setTimeout(() => setVisionMissionSuccess(null), 4000);
      } catch (err: any) {
        alert('Gagal mengatur ulang: ' + (err?.message || 'Terjadi kesalahan sistem'));
      } finally {
        setIsSavingVisionMission(false);
      }
    }
  };

  // Contact Handlers
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.address.trim()) {
      alert('Mohon isi alamat lengkap kantor sekretariat.');
      return;
    }
    if (!contactForm.whatsapp.trim()) {
      alert('Mohon isi nomor WhatsApp hotline.');
      return;
    }

    setIsSavingContact(true);
    try {
      await dbService.saveContactInfo(contactForm);
      await dbService.addLog({
        userId: profile?.uid || 'usr-admin',
        userName: profile?.displayName || 'Admin',
        action: 'Perbarui Informasi Kontak',
        target: 'Kontak & Sekretariat',
        details: `Memperbarui data kontak: WA ${contactForm.whatsapp}, Telp ${contactForm.phone}, Kantor ${contactForm.officeName}`,
      });
      onRefreshAll();
      setContactSuccess('Informasi kontak sekretariat & layanan UMKM berhasil disimpan!');
      setTimeout(() => setContactSuccess(null), 4000);
    } catch (err: any) {
      alert('Gagal menyimpan kontak: ' + (err?.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleResetContact = async () => {
    if (confirm('Kembalikan rincian kontak sekretariat dan layanan ke standar resmi Forum UMKM KUAT Kecamatan Tangerang?')) {
      setIsSavingContact(true);
      try {
        await dbService.saveContactInfo(INITIAL_CONTACT_INFO);
        await dbService.addLog({
          userId: profile?.uid || 'usr-admin',
          userName: profile?.displayName || 'Admin',
          action: 'Reset Kontak & Layanan',
          target: 'Kontak & Sekretariat',
          details: 'Mengembalikan rincian kontak ke data resmi Kecamatan Tangerang',
        });
        setContactForm(INITIAL_CONTACT_INFO);
        onRefreshAll();
        setContactSuccess('Kontak sekretariat berhasil dikembalikan ke standar resmi!');
        setTimeout(() => setContactSuccess(null), 4000);
      } catch (err: any) {
        alert('Gagal mengatur ulang: ' + (err?.message || 'Terjadi kesalahan sistem'));
      } finally {
        setIsSavingContact(false);
      }
    }
  };

  // Backup data
  const handleBackup = async () => {
    try {
      const json = await dbService.exportFullBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Backup_UMKM_KUAT_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupSuccess('Pencadangan berhasil diunduh ke perangkat Anda.');
      setTimeout(() => setBackupSuccess(null), 5000);
    } catch (e) {
      alert('Gagal membuat file cadangan.');
    }
  };

  // Restore data from JSON
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const ok = await dbService.importBackup(text);
        if (ok) {
          setRestoreStatus('Data berhasil dipulihkan dari file cadangan.');
          await loadOrgStructure();
          onRefreshAll();
        } else {
          setRestoreStatus('Format file tidak valid.');
        }
      } catch (err) {
        setRestoreStatus('Gagal membaca file.');
      }
      setTimeout(() => setRestoreStatus(null), 5000);
    };
    reader.readAsText(file);
  };

  // Reset to demo data
  const handleResetDemo = () => {
    if (confirm('Apakah Anda yakin ingin memuat ulang data percontohan (Demo Data) Forum UMKM KUAT?')) {
      dbService.resetDemoData();
      loadOrgStructure();
      onRefreshAll();
      alert('Data demo berhasil dimuat ulang!');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Pengaturan Sistem & Struktur Organisasi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Kelola struktur kepengurusan resmi, peran RBAC pengurus, pencadangan basis data, dan audit log.
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('struktur')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'struktur'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Users2 className="w-4 h-4" />
          <span>Struktur Organisasi</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
            activeTab === 'struktur' ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {orgList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('visimisi')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'visimisi'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Visi & Misi Organisasi</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
            activeTab === 'visimisi' ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {missionsList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('kontak')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'kontak'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>Kontak & Layanan</span>
        </button>

        <button
          onClick={() => setActiveTab('rbac')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'rbac'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Hak Akses Peran (RBAC)</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'database'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Cadangan & Pulihkan Database</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Audit Trail Log</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
            activeTab === 'logs' ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {logs.length}
          </span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-teal-50 border border-teal-200 text-teal-800 text-xs rounded-2xl flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
          <span className="font-semibold">{saveSuccess}</span>
        </div>
      )}

      {/* TAB 1: STRUKTUR ORGANISASI */}
      {activeTab === 'struktur' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded">
                  Kepengurusan Resmi
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-2">
                  Daftar Pimpinan & Pengurus Forum UMKM KUAT
                </h3>
                <p className="text-xs text-slate-500">
                  Data ini ditampilkan langsung di Halaman Profil Organisasi publik. Anda dapat memperbarui foto, nama, jabatan, serta urutan kepengurusan.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetOrgStructure}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Kembalikan ke struktur default 6 orang"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Resmi</span>
                </button>
                <button
                  onClick={() => handleOpenEdit()}
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pengurus</span>
                </button>
              </div>
            </div>

            {/* List of structure members */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {orgList.map((m) => (
                <div
                  key={m.id}
                  className="bg-slate-50/80 hover:bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src={m.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                        alt={m.name}
                        className="w-16 h-16 rounded-xl object-cover border-2 border-teal-500/30 shadow-xs"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';
                        }}
                      />
                      <span className="absolute -top-2 -left-2 bg-slate-900 text-white font-mono text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {m.order}
                      </span>
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <span className="inline-block bg-teal-100 text-teal-800 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {m.role}
                      </span>
                      <h4 className="font-black text-slate-900 text-sm truncate" title={m.name}>
                        {m.name}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2" title={m.title}>
                        {m.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-slate-200/80">
                    <button
                      onClick={() => handleOpenEdit(m)}
                      className="px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    {orgList.length > 1 && (
                      <button
                        onClick={() => handleDeleteMember(m)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Pengurus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB VISI & MISI ORGANISASI */}
      {activeTab === 'visimisi' && (
        <div className="space-y-6">
          {/* Success Banner */}
          {visionMissionSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 animate-in fade-in duration-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-sm font-semibold">{visionMissionSuccess}</div>
            </div>
          )}

          {/* Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded">
                Profil & Kebijakan Forum
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-2">
                Kelola Visi & Misi Forum UMKM KUAT
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1">
                Rumusan Visi dan Misi ini otomatis disinkronkan dan ditampilkan langsung di halaman Profil Organisasi pada website publik untuk masyarakat umum dan pelaku UMKM.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetVisionMission}
                disabled={isSavingVisionMission}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer border border-slate-300 disabled:opacity-50"
                title="Reset Visi & Misi ke susunan resmi awal"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset ke Standar</span>
              </button>
              <button
                type="button"
                onClick={handleSaveVisionMission}
                disabled={isSavingVisionMission}
                className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                {isSavingVisionMission ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-teal-200" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Editor Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Visi Section */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                        Visi Organisasi
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Cita-cita utama dan arah jangka panjang Forum UMKM KUAT
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {visionText.length} Karakter
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Teks Rumusan Visi <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={visionText}
                    onChange={(e) => setVisionText(e.target.value)}
                    placeholder="Tuliskan rumusan visi organisasi..."
                    className="w-full text-sm rounded-xl border border-slate-300 p-3.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-800 leading-relaxed font-medium transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1 italic">
                    Tips: Rumusan visi harus jelas, berbobot, dan mencerminkan semangat kemandirian pelaku UMKM di Kecamatan Tangerang.
                  </p>
                </div>
              </div>

              {/* Misi Section */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-bold">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                        Misi Organisasi
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Poin-poin langkah nyata, program kerja prioritas, dan target capaian
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded">
                    {missionsList.length} Poin Misi
                  </span>
                </div>

                {/* List of existing missions */}
                <div className="space-y-3">
                  {missionsList.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-3"
                    >
                      <div className="flex items-center gap-2 sm:flex-col sm:gap-1">
                        <span className="h-6 w-6 rounded-lg bg-teal-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveMission(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            title="Pindah ke atas"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveMission(idx, 'down')}
                            disabled={idx === missionsList.length - 1}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            title="Pindah ke bawah"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 w-full">
                        <textarea
                          rows={2}
                          value={m}
                          onChange={(e) => handleUpdateMission(idx, e.target.value)}
                          className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 bg-white p-2.5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-medium text-slate-800 leading-snug resize-y"
                          placeholder={`Poin misi ke-${idx + 1}...`}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteMission(idx)}
                        disabled={missionsList.length <= 1}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer self-end sm:self-center disabled:opacity-30 disabled:pointer-events-none"
                        title="Hapus poin misi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new mission input */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tambah Poin Misi Baru
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={newMissionInput}
                      onChange={(e) => setNewMissionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddMission();
                        }
                      }}
                      placeholder="Ketik poin misi baru, lalu tekan Tambah..."
                      className="flex-1 text-xs sm:text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleAddMission}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-teal-800 bg-teal-100/80 hover:bg-teal-200 transition-colors cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Poin</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom save bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-slate-500 text-center sm:text-left">
                  Pastikan menekan tombol <strong>Simpan Perubahan</strong> agar revisi Visi & Misi langsung aktif di website publik.
                </span>
                <button
                  type="button"
                  onClick={handleSaveVisionMission}
                  disabled={isSavingVisionMission}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSavingVisionMission ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Perubahan Visi & Misi</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Preview Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="sticky top-24 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Pratinjau Live di Website Publik</span>
                  </div>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Sesuai Tampilan Pengunjung
                  </span>
                </div>

                {/* Public Card Mockup: Visi */}
                <div className="bg-gradient-to-br from-teal-900 to-teal-950 text-white rounded-2xl p-5 shadow-sm border border-teal-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-teal-300 block">
                        Arah Tujuan
                      </span>
                      <h5 className="text-base font-extrabold text-white">Visi Organisasi</h5>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic border-l-2 border-teal-400 pl-3">
                    &ldquo;{visionText || 'Belum ada rumusan visi...'}&rdquo;
                  </p>
                </div>

                {/* Public Card Mockup: Misi */}
                <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-orange-600 block">
                        Langkah Nyata
                      </span>
                      <h5 className="text-base font-extrabold text-slate-900">Misi Organisasi</h5>
                    </div>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {missionsList.map((m, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{m || '(Poin misi kosong)'}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>
                    Perubahan langsung disimpan ke basis data Firestore dan disinkronkan ke seluruh sesi pengguna tanpa perlu deploy ulang.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: KONTAK & LAYANAN PUBLIK */}
      {activeTab === 'kontak' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded">
                Informasi Kontak & Layanan Publik
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">
                Pengaturan Kontak Sekretariat & Layanan UMKM
              </h3>
              <p className="text-xs text-slate-500 max-w-2xl mt-1">
                Kelola nomor WhatsApp aduan / hotline, nomor telepon kantor, alamat fisik sekretariat, jam operasional, dan tautan lokasi. Data ini disinkronkan secara langsung ke Halaman Kontak dan Footer Website Publik.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetContact}
                disabled={isSavingContact}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset ke Standar</span>
              </button>
            </div>
          </div>

          {contactSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 text-xs font-medium animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{contactSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Edit Kontak (7 cols) */}
            <form onSubmit={handleSaveContact} className="lg:col-span-7 space-y-5">
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  <h4 className="text-sm font-bold text-slate-900">Lokasi & Gedung Sekretariat</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Gedung / Kantor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.officeName}
                      onChange={(e) => setContactForm({ ...contactForm, officeName: e.target.value })}
                      placeholder="Contoh: Kantor Kecamatan Tangerang"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-hidden focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sub-Judul / Instansi Wilayah
                    </label>
                    <input
                      type="text"
                      value={contactForm.subTitle}
                      onChange={(e) => setContactForm({ ...contactForm, subTitle: e.target.value })}
                      placeholder="Contoh: Pemerintah Kota Tangerang, Provinsi Banten"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-hidden focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alamat Lengkap Sekretariat <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={contactForm.address}
                    onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                    placeholder="Tuliskan nama jalan, lantai gedung, nomor, kelurahan, dan kode pos..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-hidden focus:border-teal-500 leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Alamat ini akan ditampilkan di kartu kontak utama dan catatan kaki (footer) website.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tautan Google Maps Lokasi
                  </label>
                  <input
                    type="url"
                    value={contactForm.googleMapsUrl || ''}
                    onChange={(e) => setContactForm({ ...contactForm, googleMapsUrl: e.target.value })}
                    placeholder="https://maps.google.com/?q=..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-hidden focus:border-teal-500 font-mono"
                  />
                </div>
              </div>

              {/* Saluran Komunikasi Langsung */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <Phone className="w-4 h-4 text-teal-600" />
                  <h4 className="text-sm font-bold text-slate-900">Saluran Komunikasi & Layanan</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor WhatsApp Hotline <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.whatsapp}
                      onChange={(e) => setContactForm({ ...contactForm, whatsapp: e.target.value })}
                      placeholder="Contoh: 085880942565"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-hidden focus:border-teal-500"
                    />
                    <p className="text-[10px] text-teal-600 font-medium mt-1">
                      &bull; Otomatis dibuatkan tombol Chat Langsung via WhatsApp di web publik
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor Telepon Kantor
                    </label>
                    <input
                      type="text"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="Contoh: (021) 5523456"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-hidden focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Alamat Email Resmi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="Contoh: umkmkectangerang@gmail.com"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-hidden focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Jam Layanan Konsultasi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.operatingHours}
                      onChange={(e) => setContactForm({ ...contactForm, operatingHours: e.target.value })}
                      placeholder="Contoh: Senin – Jumat: 08.00 – 16.00 WIB"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-hidden focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Akun Instagram (Opsional)
                    </label>
                    <input
                      type="text"
                      value={contactForm.instagram || ''}
                      onChange={(e) => setContactForm({ ...contactForm, instagram: e.target.value })}
                      placeholder="Contoh: @umkmkuattangerang"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-hidden focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Akun Facebook / Grup (Opsional)
                    </label>
                    <input
                      type="text"
                      value={contactForm.facebook || ''}
                      onChange={(e) => setContactForm({ ...contactForm, facebook: e.target.value })}
                      placeholder="Contoh: Forum UMKM KUAT Kec Tangerang"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-hidden focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingContact}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSavingContact ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan ke Basis Data...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Perubahan Informasi Kontak</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Live Preview (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Pratinjau Live di Website Publik</span>
                </div>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Sinkron Otomatis
                </span>
              </div>

              {/* Mockup Card Contact Info from public website */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl border border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">
                    Lokasi Sekretariat
                  </span>
                  <h3 className="text-lg font-bold mt-0.5">{contactForm.officeName || 'Nama Gedung'}</h3>
                  <p className="text-xs text-slate-400">
                    {contactForm.subTitle || 'Instansi Wilayah'}
                  </p>
                </div>

                <div className="space-y-3.5 text-xs text-slate-300">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      {contactForm.address || 'Alamat kantor sekretariat...'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Telepon: {contactForm.phone || '-'}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Hotline WA: {contactForm.whatsapp || '-'}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>{contactForm.email || '-'}</span>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-white">Jam Layanan Konsultasi:</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {contactForm.operatingHours || '-'}
                      </div>
                    </div>
                  </div>
                </div>

                {contactForm.whatsapp && (
                  <div className="pt-3 border-t border-slate-800">
                    {(() => {
                      const clean = contactForm.whatsapp.replace(/[^0-9]/g, '');
                      const formatted = clean.startsWith('0') ? '62' + clean.slice(1) : clean;
                      return (
                        <a
                          href={`https://wa.me/${formatted}?text=Halo%20Sekretariat%20Forum%20UMKM%20KUAT%20Kecamatan%20Tangerang`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition-all"
                        >
                          <span>Chat Langsung via WhatsApp</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Footer Preview snippet */}
              <div className="bg-slate-900 text-slate-300 rounded-2xl p-4 border border-slate-800 text-xs space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                  Tampilan pada Footer Website
                </div>
                <div className="text-slate-400 text-[11px] flex items-center gap-2">
                  <Phone className="w-3 h-3 text-teal-400 shrink-0" />
                  <span>{contactForm.phone} / WA {contactForm.whatsapp}</span>
                </div>
                <div className="text-slate-400 text-[11px] flex items-center gap-2">
                  <Mail className="w-3 h-3 text-teal-400 shrink-0" />
                  <span>{contactForm.email}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>
                  Perubahan data kontak disimpan langsung ke koleksi Firestore <code>org_settings/contact_info</code> dan langsung memperbarui seluruh halaman publik secara real-time.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HAK AKSES PERAN (RBAC) */}
      {activeTab === 'rbac' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded">
                Role-Based Access Control (RBAC)
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">
                Matriks 7 Peran & Sistem Keamanan Akses
              </h3>
              <p className="text-xs text-slate-500 max-w-2xl mt-1">
                Sistem menerapkan prinsip <em>Least Privilege</em> & <em>Strict Isolation</em>: Hanya Super Admin yang berwenang mengatur penugasan peran. Seluruh pendaftar baru mandiri otomatis berstatus peran <strong>Member</strong> dan dilarang mengakses panel admin internal.
              </p>
            </div>
            <div className="text-xs bg-slate-100 px-3 py-1.5 rounded-xl font-bold text-slate-700">
              Peran Anda Sekarang:{' '}
              <span className="text-teal-700 uppercase">{profile?.role.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rolesInfo.map((r) => {
              const isCurrent = profile?.role === r.role;
              return (
                <div
                  key={r.role}
                  className={`p-5 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'border-teal-500 bg-teal-50/30 shadow-xs'
                      : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-900 text-sm">{r.name}</h4>
                    {isCurrent && (
                      <span className="text-[10px] bg-teal-600 text-white font-bold px-2 py-0.5 rounded">
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{r.description}</p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Kewenangan:
                    </span>
                    {r.permissions.map((perm, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                        <span>{perm}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/80">
                    <button
                      onClick={() => simulateRole(r.role)}
                      className="w-full text-center py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
                    >
                      Beralih ke Peran Ini
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* USER MANAGEMENT & ROLE ASSIGNMENT SECTION */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-bold uppercase tracking-wider mb-1">
                  <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>Manajemen Pengguna Resmi</span>
                </div>
                <h4 className="text-base font-black text-slate-900">
                  Daftar Akun Pengurus & Penugasan Hak Akses
                </h4>
                <p className="text-xs text-slate-500">
                  Sesuai Prinsip Least Privilege, Super Admin dapat mendaftarkan akun pengurus dan mengatur penugasan peran secara terpusat.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenUserEdit()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah Akun Pengurus</span>
              </button>
            </div>

            {userSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{userSuccess}</span>
              </div>
            )}

            {/* Table of Users */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-4">Nama Pengurus</th>
                    <th className="py-3 px-4">Email Akun</th>
                    <th className="py-3 px-4">Hak Akses / Peran</th>
                    <th className="py-3 px-4">Wilayah Binaan</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userList.map((u) => {
                    const roleColorMap: Record<UserRole, string> = {
                      super_admin: 'bg-red-50 text-red-700 border-red-200',
                      pengurus_kecamatan: 'bg-blue-50 text-blue-700 border-blue-200',
                      admin_keanggotaan: 'bg-teal-50 text-teal-700 border-teal-200',
                      bendahara: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      admin_informasi: 'bg-purple-50 text-purple-700 border-purple-200',
                      pengurus_kelurahan: 'bg-amber-50 text-amber-700 border-amber-200',
                      member: 'bg-slate-100 text-slate-700 border-slate-200',
                    };

                    const roleLabelMap: Record<UserRole, string> = {
                      super_admin: 'Super Admin',
                      pengurus_kecamatan: 'Pengurus Kecamatan',
                      admin_keanggotaan: 'Admin Keanggotaan',
                      bendahara: 'Bendahara',
                      admin_informasi: 'Admin Informasi',
                      pengurus_kelurahan: 'Pengurus Kelurahan',
                      member: 'Member / Pendaftar',
                    };

                    return (
                      <tr key={u.uid} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {u.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div>{u.displayName}</div>
                            {u.email === 'umkmkectangerang@gmail.com' && (
                              <span className="text-[10px] text-teal-600 font-semibold">&bull; Akun Resmi Kecamatan</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {u.email}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2.5 py-1 rounded-lg border text-[11px] font-bold ${roleColorMap[u.role] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                            {roleLabelMap[u.role] || u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {u.kelurahan || 'Kecamatan Tangerang'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenUserEdit(u)}
                              className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Ubah Hak Akses"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Ubah Hak Akses</span>
                            </button>
                            {u.email !== 'umkmkectangerang@gmail.com' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Akses Pengguna"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CADANGAN & PEMULIHAN */}
      {activeTab === 'database' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-700 bg-orange-50 px-2.5 py-1 rounded">
              Keamanan Data & Pemulihan
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-2">
              Pencadangan & Pemulihan Database (Backup & Restore)
            </h3>
            <p className="text-xs text-slate-500">
              Simpan seluruh data keanggotaan, riwayat keuangan, event, berita, dan struktur organisasi dalam bentuk file JSON ke penyimpanan lokal Anda.
            </p>
          </div>

          {backupSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{backupSuccess}</span>
            </div>
          )}

          {restoreStatus && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{restoreStatus}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Backup Button */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-2">
                  <Download className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Cadangkan Data (Backup)</h4>
                <p className="text-xs text-slate-500">
                  Unduh file cadangan lengkap database JSON ke komputer atau ponsel Anda.
                </p>
              </div>
              <button
                onClick={handleBackup}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Cadangan JSON</span>
              </button>
            </div>

            {/* Restore Button */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Pulihkan Data (Restore)</h4>
                <p className="text-xs text-slate-500">
                  Pulihkan data dari file cadangan JSON yang pernah Anda simpan sebelumnya.
                </p>
              </div>
              <label className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                <span>Unggah File Cadangan</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFile}
                  className="hidden"
                />
              </label>
            </div>

            {/* Reset Demo Button */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center mb-2">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Muat Data Demo</h4>
                <p className="text-xs text-slate-500">
                  Kembalikan data percontohan lengkap Forum UMKM KUAT untuk 8 kelurahan.
                </p>
              </div>
              <button
                onClick={handleResetDemo}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-orange-700 border border-orange-300 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset ke Data Demo</span>
              </button>
            </div>
          </div>

          {/* Section: Kosongkan Data Keanggotaan & Keuangan */}
          <div className="p-5 rounded-2xl border border-red-200 bg-red-50/50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-black text-red-900 text-sm flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <span>Kosongkan Seluruh Data Keanggotaan & Keuangan</span>
                </h4>
                <p className="text-xs text-red-700 mt-1">
                  Menghapus bersih seluruh data anggota UMKM dan transaksi buku kas agar basis data kosong dan siap digunakan dari awal.
                </p>
              </div>
              <button
                disabled={isClearing}
                onClick={handleClearAllData}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-xs"
              >
                {isClearing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{isClearing ? 'Mengosongkan...' : 'Kosongkan Data Sekarang'}</span>
              </button>
            </div>
            {clearStatus && (
              <div className="p-2.5 bg-green-100 border border-green-300 text-green-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-green-700" />
                <span>{clearStatus}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              <h3 className="font-black text-slate-900 text-lg">
                Audit Trail & Riwayat Aktivitas Sistem
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {logs.length} aktivitas tercatat
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span>{log.userName}</span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="text-teal-700 font-semibold">{log.action}</span>
                  </div>
                  <div className="text-xs text-slate-600">{log.details}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Target: {log.target}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString('id-ID', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL FORM EDIT / TAMBAH PENGURUS */}
      {isModalOpen && editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-teal-800 to-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users2 className="w-5 h-5 text-teal-300" />
                <h3 className="font-black text-base">
                  {editingMember.id.startsWith('org-') && orgList.some(o => o.id === editingMember.id)
                    ? 'Edit Profil Pengurus'
                    : 'Tambah Pengurus Baru'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingMember(null);
                }}
                className="text-white/80 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveMember} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {/* Photo preview and upload */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="relative">
                  <img
                    src={editingMember.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                    alt="Preview"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-teal-500 shadow-sm"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 bg-teal-600 hover:bg-teal-700 text-white p-1.5 rounded-full shadow-md cursor-pointer"
                    title="Ganti Foto"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2 flex-1">
                  <label className="block font-bold text-slate-800">
                    Foto Pengurus Resmi (3x4 / Persegi)
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isCompressingPhoto}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 rounded-lg cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isCompressingPhoto ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                          <span>Memproses Foto...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Unggah Foto</span>
                        </>
                      )}
                    </button>
                    {editingMember.image && !isCompressingPhoto && (
                      <span className="text-[11px] text-teal-700 font-semibold flex items-center gap-1 bg-teal-50 px-2 py-1 rounded-md border border-teal-200">
                        <Check className="w-3.5 h-3.5" /> Foto terpasang & siap disimpan
                      </span>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <p className="text-[10px] text-slate-500">
                    Format: JPG, PNG, WebP. Sistem otomatis mengompresi foto agar tersimpan cepat & ringan ke basis data.
                  </p>
                </div>
              </div>

              {/* URL Foto (Opsional) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Atau Masukkan URL Foto Eksternal (Opsional)
                </label>
                <input
                  type="text"
                  value={editingMember.image?.startsWith('data:') ? '' : (editingMember.image || '')}
                  onChange={(e) => setEditingMember({ ...editingMember, image: e.target.value })}
                  placeholder="https://... atau path gambar"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500 font-mono"
                />
              </div>

              {/* Peran / Jabatan & Urutan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Jabatan / Posisi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMember.role || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                    placeholder="Contoh: Pelindung, Ketua, Bendahara"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Urutan Tampilan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={editingMember.order || 1}
                    onChange={(e) => setEditingMember({ ...editingMember, order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500 text-center font-bold"
                  />
                </div>
              </div>

              {/* Nama Lengkap & Gelar */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Beserta Gelar <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingMember.name || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  placeholder="Contoh: Riswan Setyo Kardinto, S.STP"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500 font-bold"
                />
              </div>

              {/* Keterangan Jabatan / Instansi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Keterangan Jabatan / Instansi
                </label>
                <textarea
                  rows={2}
                  value={editingMember.title || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, title: e.target.value })}
                  placeholder="Contoh: Camat Kecamatan Tangerang / Ketua Forum UMKM KUAT"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingMember(null);
                  }}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSavingOrg || isCompressingPhoto}
                  onClick={(e) => handleSaveMember(e)}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  {isSavingOrg ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan ke Basis Data...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL USER MANAGEMENT & ROLE ASSIGNMENT */}
      {isUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-100 text-teal-700 rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    {editingUser.uid.startsWith('usr-') && !editingUser.displayName ? 'Tambah Akun Pengurus Baru' : 'Ubah Hak Akses & Peran Akun'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Atur kewenangan peran pengguna sesuai prinsip keamanan RBAC.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsUserModalOpen(false);
                  setEditingUser(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Pengurus <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.displayName}
                  onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                  placeholder="Contoh: Riswan Setyo Kardinto / EMus Muslihant"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alamat Email Akun Login <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  placeholder="Contoh: umkmkectangerang@gmail.com"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Email ini digunakan saat pengguna login dengan akun Google atau Firebase Auth.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Penugasan Hak Akses / Peran <span className="text-red-500">*</span>
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500 font-bold text-slate-800"
                >
                  <option value="super_admin">Super Admin (Kewenangan Penuh)</option>
                  <option value="pengurus_kecamatan">Pengurus Kecamatan</option>
                  <option value="admin_keanggotaan">Admin Keanggotaan</option>
                  <option value="bendahara">Bendahara</option>
                  <option value="admin_informasi">Admin Informasi</option>
                  <option value="pengurus_kelurahan">Pengurus Kelurahan</option>
                  <option value="member">Member / Pendaftar Mandiri (Akses Terbatas)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Wilayah Kelurahan Binaan
                </label>
                <select
                  value={editingUser.kelurahan || 'Semua Kelurahan (Kecamatan)'}
                  onChange={(e) => setEditingUser({ ...editingUser, kelurahan: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500 font-medium text-slate-800"
                >
                  <option value="Semua Kelurahan (Kecamatan)">Semua Kelurahan (Kecamatan Tangerang)</option>
                  <option value="Babakan">Kelurahan Babakan</option>
                  <option value="Buaran Indah">Kelurahan Buaran Indah</option>
                  <option value="Cikokol">Kelurahan Cikokol</option>
                  <option value="Kelapa Indah">Kelurahan Kelapa Indah</option>
                  <option value="Suka Asih">Kelurahan Suka Asih</option>
                  <option value="Sukarasa">Kelurahan Sukarasa</option>
                  <option value="Sukasari">Kelurahan Sukasari</option>
                  <option value="Tanah Tinggi">Kelurahan Tanah Tinggi</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  {isSavingUser ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Hak Akses</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
