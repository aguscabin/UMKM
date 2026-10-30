import React, { useState, useRef } from 'react';
import { Member, KELURAHAN_LIST } from '../../types';
import { dbService } from '../../services/db';
import { OFFICIAL_LOGO_URL } from '../../components/UmkmKuatLogo';
import { MemberCardModal } from '../../components/MemberCardModal';
import {
  Sparkles,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Building2,
} from 'lucide-react';

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

  const handleMemberPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({
        ...prev,
        memberPhoto: event.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleProductPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({
        ...prev,
        productPhoto: event.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicationWarning(null);

    // Duplication check
    const duplicateNik = members.find((m) => m.nik === formData.nik);
    if (duplicateNik) {
      setDuplicationWarning(`NIK ${formData.nik} sudah terdaftar dengan nama ${duplicateNik.fullName}`);
      return;
    }

    const duplicatePhone = members.find((m) => m.phone === formData.phone);
    if (duplicatePhone) {
      setDuplicationWarning(`No. WhatsApp ${formData.phone} sudah terdaftar di sistem.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const memberNumber = generateMemberNumber();
      const newMember: Member = {
        id: 'mem-' + Date.now(),
        memberNumber,
        fullName: formData.fullName,
        nik: formData.nik,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        kelurahan: formData.kelurahan,
        status: 'aktif',
        joinDate: new Date().toISOString().split('T')[0],
        businessName: formData.businessName,
        category: formData.category,
        topProduct: formData.topProduct,
        businessAddress: formData.businessAddress || formData.address,
        businessPhone: formData.businessPhone || formData.phone,
        memberPhoto: formData.memberPhoto,
        productPhoto: formData.productPhoto,
        legalities: formData.legalities,
        isPublicDirectory: formData.isPublicDirectory,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dbService.saveMember(newMember);
      await dbService.addLog({
        userId: 'publik-online',
        userName: formData.fullName,
        action: 'Pendaftaran Online Mandiri',
        target: newMember.memberNumber,
        details: `Pendaftaran UMKM mandiri melalui link publik (Kel. ${newMember.kelurahan})`,
      });

      onRegistrationSuccess();
      setCreatedMember(newMember);
    } catch (err) {
      console.error(err);
      alert('Terjadi kendala saat menyimpan pendaftaran. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-orange-600" />
          <span>Pendaftaran Online Resmi Anggota</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Formulir Pendaftaran Anggota UMKM KUAT
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
          Daftarkan usaha Anda sekarang untuk mendapatkan pendampingan NIB OSS, sertifikasi Halal gratis, promosi katalog, dan akses kegiatan bazar Kecamatan Tangerang.
        </p>
      </div>

      {/* Main Registration Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6">
        {duplicationWarning && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{duplicationWarning}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* UPLOAD PAS FOTO ANGGOTA */}
          <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
            <div className="w-24 h-28 rounded-xl overflow-hidden bg-white border-2 border-teal-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              {formData.memberPhoto ? (
                <img src={formData.memberPhoto} alt="Pas Foto" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-teal-600 p-2">
                  <Camera className="w-6 h-6 mx-auto mb-1" />
                  <span className="text-[9px] font-bold">Pas Foto</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5 text-center sm:text-left flex-1">
              <div className="text-xs font-bold text-teal-950 flex items-center justify-center sm:justify-start gap-1.5">
                <CreditCard className="w-4 h-4 text-teal-600" />
                <span>Upload Foto Pemilik Usaha (Akan Tampil di KTA Resmi)</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Pilih pas foto wajah atau foto selfie langsung dari kamera smartphone Anda.
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => memberPhotoRef.current?.click()}
                  className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Camera className="w-4 h-4" />
                  <span>{formData.memberPhoto ? 'Ganti Foto' : 'Pilih / Ambil Foto'}</span>
                </button>
                {formData.memberPhoto && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, memberPhoto: '' })}
                    className="px-2.5 py-2 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold cursor-pointer"
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg">
              1. Identitas Pelaku Usaha
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap (Sesuai KTP) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Contoh: Siti Rohmah"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIK (16 Digit KTP) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  value={formData.nik}
                  onChange={(e) => {
                    setDuplicationWarning(null);
                    setFormData({ ...formData, nik: e.target.value });
                  }}
                  placeholder="367101..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor WhatsApp Aktif <span className="text-red-500">*</span>
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
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500"
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
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kelurahan di Kecamatan Tangerang <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.kelurahan}
                  onChange={(e) => setFormData({ ...formData, kelurahan: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium text-slate-700"
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
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500"
              />
            </div>
          </div>

          {/* DATA USAHA & PRODUK */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-800 bg-orange-50 px-3 py-1.5 rounded-lg">
              2. Profil Usaha & Produk
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Usaha / Merk Dagang <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="Contoh: Dapur Kue Tradisional"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori Sektor Usaha <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium text-slate-700"
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Produk Unggulan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.topProduct}
                  onChange={(e) => setFormData({ ...formData, topProduct: e.target.value })}
                  placeholder="Contoh: Kue Cucur Pandan & Tumpeng Mini"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Legalitas Saat Ini
                </label>
                <input
                  type="text"
                  value={formData.legalities}
                  onChange={(e) => setFormData({ ...formData, legalities: e.target.value })}
                  placeholder="NIB, Halal, P-IRT (atau tulis 'Belum Ada')"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Foto Produk Unggulan
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => productPhotoRef.current?.click()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-teal-600" />
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
                  <img src={formData.productPhoto} alt="Produk" className="h-10 w-10 object-cover rounded-xl border border-slate-300" />
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-xs text-slate-900">
                Tampilkan usaha di Direktori Publik UMKM KUAT?
              </div>
              <div className="text-[11px] text-slate-500">
                Membantu calon pelanggan menemukan produk Anda (NIK tetap rahasia).
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.isPublicDirectory}
              onChange={(e) => setFormData({ ...formData, isPublicDirectory: e.target.checked })}
              className="h-5 w-5 text-teal-600 rounded cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 hover:from-teal-700 hover:to-teal-900 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-5 h-5 text-orange-400" />
            <span>{isSubmitting ? 'Memproses Pendaftaran...' : 'Kirim Pendaftaran & Dapatkan Kartu Anggota (KTA)'}</span>
            <ArrowRight className="w-4 h-4" />
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
