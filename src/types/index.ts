export type UserRole = 
  | 'super_admin'
  | 'pengurus_kecamatan'
  | 'admin_keanggotaan'
  | 'bendahara'
  | 'admin_informasi'
  | 'pengurus_kelurahan'
  | 'member';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  kelurahan?: string;
  photoURL?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type BusinessCategory =
  | 'Kuliner'
  | 'Fashion & Tekstil'
  | 'Kriya & Kerajinan'
  | 'Jasa & Konsultasi'
  | 'Perdagangan & Toko'
  | 'Pertanian & Agro'
  | 'Kesehatan & Kecantikan'
  | 'Teknologi & Digital'
  | 'Lainnya';

export const KELURAHAN_LIST = [
  'Babakan',
  'Buaran Indah',
  'Cikokol',
  'Kelapa Indah',
  'Suka Asih',
  'Sukarasa',
  'Sukasari',
  'Tanah Tinggi',
] as const;

export type Kelurahan = typeof KELURAHAN_LIST[number];

export interface Member {
  id: string;
  memberNumber: string; // e.g. KUAT-TNG-2026-001
  fullName: string;
  nik: string; // Protected, private in admin
  phone: string;
  email?: string;
  address: string;
  kelurahan: Kelurahan | string;
  status: 'aktif' | 'nonaktif' | 'pending';
  joinDate: string;
  
  // Usaha
  businessName: string;
  category: BusinessCategory | string;
  topProduct: string;
  businessAddress: string;
  businessPhone: string;
  memberPhoto?: string; // Pas foto anggota
  productPhoto?: string;
  legalities: string; // NIB, Halal, P-IRT, dsb.
  
  // Pengaturan Privasi
  isPublicDirectory: boolean; // apakah boleh tampil di website publik
  
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'pemasukan' | 'pengeluaran';

export interface Transaction {
  id: string;
  transactionNumber: string; // e.g. TRX-2026-001
  type: TransactionType;
  category: string; // Iuran Anggota, Donasi, Bantuan Pemerintah, Sponsor, Hasil Bazar, Operasional, dsb.
  date: string;
  amount: number;
  description: string;
  recorderName: string;
  recorderId: string;
  approvalStatus: 'disetujui' | 'menunggu' | 'ditolak';
  approvedBy?: string;
  proofUrl?: string;
  notes?: string;
  history?: Array<{
    timestamp: string;
    action: string;
    userName: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ForumEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  posterUrl?: string;
  documentationUrls?: string;
  status: 'terbit' | 'draf' | 'arsip' | 'selesai';
  targetAudience?: string;
  registrationUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  authorId?: string;
  imageUrl?: string;
  publishedDate: string;
  status: 'terbit' | 'draf' | 'arsip';
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
}

export interface OrgStructureMember {
  id: string;
  role: string;
  name: string;
  title: string;
  image: string;
  order: number;
  updatedAt?: string;
}

export interface OrgVisionMission {
  vision: string;
  missions: string[];
  updatedAt?: string;
}

export interface OrgContactInfo {
  officeName: string;
  subTitle: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  operatingHours: string;
  googleMapsUrl?: string;
  instagram?: string;
  facebook?: string;
  updatedAt?: string;
}
