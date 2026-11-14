import React, { useState, useRef } from 'react';
import { Member, KELURAHAN_LIST } from '../../types';
import { dbService } from '../../services/db';
import { OFFICIAL_LOGO_URL } from '../../components/UmkmKuatLogo';
import { MemberCardModal } from '../../components/MemberCardModal';
import { compressImage } from '../../utils/image';
import { validateMemberInput, validateUploadedFile } from '../../utils/validation';
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Building2,
} from 'lucide-react';
import { InlineShimmer } from '../../components/common/Skeleton';

interface RegisterPageProps {
  members: Member[];
  onRegistrationSuccess: () => void;
  setCurrentTab: (tab: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  members,
  onRegistrationSuccess,
  setCurrentTab,
}) => {
  const [createdMember, setCreatedMember] = useState<Member | null>(null);
  const [duplicationWarning, setDuplicationWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const memberPhotoRef = useRef<HTMLInputElement>(null);
  const productPhotoRef = useRef<HTMLInputElement>(null);

  // Generate unique number
  const generateMemberNumber = () => {
    const year = new Date().getFullYear();
    const count = members.length + 1;
    return `KUAT-TNG-${year}-${String(count).padStart(3, '0')}`;
  };

  const [formData, setFormData] = useState({
    fullName: '',
    nik: '',
    phone: '',
    email: '',
    address: '',
    kelurahan: 'Babakan',
    businessName: '',
    category: 'Kuliner',
    topProduct: '',
    businessAddress: '',
    businessPhone: '',
    memberPhoto: '',
    productPhoto: '',
    legalities: 'NIB, Sertifikat Halal',
    isPublicDirectory: true,
  });

  const handleMemberPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileCheck = validateUploadedFile(file, 'image');
    if (!fileCheck.valid) {
      setDuplicationWarning(fileCheck.error || 'File pas foto tidak valid.');
      if (e.target) e.target.value = '';
      return;
    }
    try {
      const compressed = await compressImage(file, 500, 500, 0.82);
      setDuplicationWarning(null);
      setFormData((prev) => ({
        ...prev,
        memberPhoto: compressed,
      }));
    } catch (err: any) {
      setDuplicationWarning('Gagal memproses pas foto: ' + (err?.message || 'Format tidak didukung'));
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleProductPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileCheck = validateUploadedFile(file, 'image');
    if (!fileCheck.valid) {
      setDuplicationWarning(fileCheck.error || 'File foto produk tidak valid.');
      if (e.target) e.target.value = '';
      return;
    }
    try {
      const compressed = await compressImage(file, 600, 600, 0.82);
      setDuplicationWarning(null);
      setFormData((prev) => ({
        ...prev,
        productPhoto: compressed,
      }));
    } catch (err: any) {
      setDuplicationWarning('Gagal memproses foto produk: ' + (err?.message || 'Format tidak didukung'));
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicationWarning(null);

    const validation = validateMemberInput(
      {
        ...formData,
        status: 'aktif',
      },
      { requireValidNik: true }
    );
    if (!validation.valid) {
      setDuplicationWarning(validation.errors[0] || 'Mohon periksa kembali data formulir Anda.');
      return;
    }

    const sanitized = validation.sanitized;

    // Duplication check
    const duplicateNik = members.find((m) => m.nik === sanitized.nik);
    if (duplicateNik) {
      setDuplicationWarning(`NIK ${sanitized.nik} sudah terdaftar dengan nama ${duplicateNik.fullName}`);
      return;
    }

    const normalizedPhone = sanitized.phone.replace(/\D/g, '');
    const duplicatePhone = members.find((m) => m.phone.replace(/\D/g, '') === normalizedPhone);
    if (duplicatePhone) {
      setDuplicationWarning(`No. WhatsApp ${sanitized.phone} sudah terdaftar di sistem.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const memberNumber = generateMemberNumber();
      const newMember: Member = {
        ...sanitized,
        id: 'mem-' + Date.now(),
        memberNumber,
        status: 'aktif',
        joinDate: new Date().toISOString().split('T')[0],
        businessAddress: sanitized.businessAddress || sanitized.address,
        businessPhone: sanitized.businessPhone || sanitized.phone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const savedMember = await dbService.registerPublicMember(newMember);

      onRegistrationSuccess();
      setCreatedMember(savedMember);
    } catch (err: any) {
      console.error(err);
      setDuplicationWarning(
        err?.message || 'Terjadi kendala saat menyimpan pendaftaran. Silakan coba kembali.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700 block">
          Pendaftaran Online Resmi Anggota
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight">
          Formulir Pendaftaran Anggota UMKM KUAT
        </h1>
        <p className="text-stone-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Daftarkan usaha Anda sekarang untuk mendapatkan pendampingan NIB OSS, sertifikasi Halal gratis, promosi katalog, dan akses kegiatan bazar Kecamatan Tangerang.
        </p>
      </div>

      {/* Main Registration Form */}
      <div className="bg-white rounded-2xl p-6 sm:p-10 border border-stone-200 space-y-6">
        {duplicationWarning && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{duplicationWarning}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* UPLOAD PAS FOTO ANGGOTA */}
          <div className="p-4 sm:p-5 bg-stone-50 border border-stone-200 rounded-xl flex flex-col sm:flex-row items-center gap-4">
            <div className="w-24 h-28 rounded-xl overflow-hidden bg-white border border-stone-300 flex items-center justify-center flex-shrink-0">
              {formData.memberPhoto ? (
                <img src={formData.memberPhoto} alt="Pas Foto" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-teal-700 p-2">
                  <Camera className="w-6 h-6 mx-auto mb-1" />
                  <span className="text-[9px] font-bold">Pas Foto</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5 text-center sm:text-left flex-1">
              <div className="text-xs font-bold text-stone-900 flex items-center justify-center sm:justify-start gap-1.5">
                <CreditCard className="w-4 h-4 text-teal-700" />
                <span>Upload Foto Pemilik Usaha (Akan Tampil di KTA Resmi)</span>
              </div>
              <p className="text-[11px] text-stone-600">
                Pilih pas foto wajah atau foto selfie langsung dari kamera smartphone Anda.
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => memberPhotoRef.current?.click()}
                  className="px-4 py-2 min-h-[40px] bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>{formData.memberPhoto ? 'Ganti Foto' : 'Pilih / Ambil Foto'}</span>
                </button>
                {formData.memberPhoto && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, memberPhoto: '' })}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
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

          {/* DATA PRIBADI */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900 bg-teal-50 border border-teal-200/80 px-3.5 py-2 rounded-lg">
              1. Identitas Pelaku Usaha
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Nama Lengkap (Sesuai KTP) <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Contoh: Siti Rohmah"
                  className="w-full px-3.5 py-2.5 min-h-[42px] text-xs rounded-xl border border-stone-200 bg-stone-50 text-stone-900 focus:bg-white focus:outline-none focus:border-teal-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  NIK (16 Digit KTP) <span className="text-red-600">*</span>
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
                  placeholder="367101..."
                  className="w-full px-3.5 py-2.5 min-h-[42px] text-xs rounded-xl border border-stone-200 bg-stone-50 text-stone-900 focus:bg-white focus:outline-none focus:border-teal-600 font-mono tabular-nums transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Nomor WhatsApp Aktif <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => {
                    setDuplicationWarning(null);
                    setFormData({ ...formData, phone: e.target.value });
                  }}
                  placeholder="081234567890"
                  className="w-full px-3.5 py-2.5 min-h-[42px] text-xs rounded-xl border border-stone-200 bg-stone-50 text-stone-900 focus:bg-white focus:outline-none focus:border-teal-600 tabular-nums transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@gmail.com"
                  className="w-full px-3.5 py-2.5 min-h-[42px] text-xs rounded-xl border border-stone-200 bg-stone-50 text-stone-900 focus:bg-white focus:outline-none focus:border-teal-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Kelurahan di Kecamatan Tangerang <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.kelurahan}
                  onChange={(e) => setFormData({ ...formData, kelurahan: e.target.value })}
                  className="w-full px-3.5 py-2.5 min-h-[42px] text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-teal-600 font-medium text-stone-700 transition-colors"
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
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Alamat Domisili KTP <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Jl. RT/RW Kelurahan..."
                className="w-full px-3.5 py-2.5 min-h-[42px] text-xs rounded-xl border border-stone-200 bg-stone-50 text-stone-900 focus:bg-white focus:outline-none focus:border-teal-600 transition-colors"
              />
            </div>
          </div>

          {/* DATA USAHA & PRODUK */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-50 border border-amber-200/80 px-3.5 py-2 rounded-lg">
              2. Profil Usaha & Produk
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Nama Usaha / Merk Dagang <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="Contoh: Dapur Kue Tradisional"
                  className="w-full px-3.5 py-2.5 min-h-[42px] text-xs rounded-xl border border-stone-200 bg-stone-50 text-stone-900 focus:bg-white focus:outline-none focus:border-teal-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Kategori Sektor Usaha <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 min-h-[42px] text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-teal-600 font-medium text-stone-700 transition-colors"
                >
                  <option value="Kuliner">Kuliner</option>
                  <option value="Fashion & Tekstil">Fashion & Tekstil</option>
                  <option value="Kriya & Kerajinan">Kriya & Kerajinan</option>
                  <option value="Jasa & Konsultasi">Jasa & Konsultasi</option>
                  <option value="Perdagangan & Toko">Perdagangan & Toko</option>
                  <option value="Pertanian & Agro">Pertanian & Agro</option>
                  <option value="Kesehatan & Kecantikan">Kesehatan & Kecantikan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Produk Unggulan <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.topProduct}
                  onChange={(e) => setFormData({ ...formData, topProduct: e.target.value })}
                  placeholder="Contoh: Kue Cucur Pandan & Tumpeng Mini"
                  className="w-full px-3.5 py-2.5 min-h-[42px] text-xs rounded-xl border border-stone-200 bg-stone-50 text-stone-900 focus:bg-white focus:outline-none focus:border-teal-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Legalitas Saat Ini
                </label>
                <input
                  type="text"
                  value={formData.legalities}
                  onChange={(e) => setFormData({ ...formData, legalities: e.target.value })}
                  placeholder="NIB, Halal, P-IRT (atau tulis 'Belum Ada')"
                  className="w-full px-3.5 py-2.5 min-h-[42px] text-xs rounded-xl border border-stone-200 bg-stone-50 text-stone-900 focus:bg-white focus:outline-none focus:border-teal-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Foto Produk Unggulan
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => productPhotoRef.current?.click()}
                  className="px-4 py-2.5 min-h-[42px] bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4 text-teal-700" />
                  <span>{formData.productPhoto ? 'Foto Terpilih' : 'Upload Foto Produk'}</span>
                </button>
                <input
                  ref={productPhotoRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProductPhotoUpload}
                  className="hidden"
                />
                {formData.productPhoto && (
                  <img src={formData.productPhoto} alt="Produk" className="h-10 w-10 object-cover rounded-xl border border-stone-300" />
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between gap-4">
            <div>
              <div className="font-bold text-xs text-stone-900">
                Tampilkan usaha di Direktori Publik UMKM KUAT?
              </div>
              <div className="text-[11px] text-stone-500">
                Membantu calon pelanggan menemukan produk Anda (NIK tetap rahasia).
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.isPublicDirectory}
              onChange={(e) => setFormData({ ...formData, isPublicDirectory: e.target.checked })}
              className="h-5 w-5 accent-teal-700 rounded cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-micro w-full min-h-[48px] py-3.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-75 text-white font-bold text-sm rounded-xl cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            {isSubmitting ? (
              <InlineShimmer variant="dark" label="Memproses Pendaftaran" widthClass="w-44" />
            ) : (
              <span>Kirim Pendaftaran & Dapatkan Kartu Anggota (KTA)</span>
            )}
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>

      {/* POPUP KARTU ANGGOTA OTOMATIS */}
      {createdMember && (
        <MemberCardModal
          member={createdMember}
          onClose={() => {
            setCreatedMember(null);
            setCurrentTab('direktori');
          }}
        />
      )}
    </div>
  );
};
