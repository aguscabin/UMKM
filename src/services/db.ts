import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Member, Transaction, ForumEvent, Article, ActivityLog, UserProfile, OrgStructureMember, OrgVisionMission, OrgContactInfo } from '../types';

// Initial realistic seed data for Forum UMKM KUAT Kecamatan Tangerang - empty by default (no dummy data)
export const INITIAL_MEMBERS: Member[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_EVENTS: ForumEvent[] = [
  {
    id: 'evt-001',
    title: 'Gebyar Bazar UMKM Ramadhan Cisadane 1447H',
    description: 'Pesta kuliner takjil dan bazar produk unggulan UMKM binaan Forum UMKM KUAT Kecamatan Tangerang di bantaran Sungai Cisadane. Menghadirkan lebih dari 60 stand kuliner, fashion muslim, dan kriya.',
    date: '2026-03-15',
    time: '15.00 - 22.00 WIB',
    location: 'Pelataran Cisadane Walk, Kelurahan Sukarasa, Kec. Tangerang',
    organizer: 'Forum UMKM KUAT bekerjasama dengan Kantor Kecamatan Tangerang',
    posterUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    status: 'terbit',
    targetAudience: 'Masyarakat umum & seluruh pelaku UMKM',
    registrationUrl: 'https://forms.gle/umkmbazartangerang2026',
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-02-15T09:00:00Z',
  },
  {
    id: 'evt-002',
    title: 'Workshop Akselerasi NIB OSS & Sertifikasi Halal Gratis (SEHATI)',
    description: 'Pendampingan langsung pembuatan Nomor Induk Berusaha (NIB) berbasis risiko dan pengajuan sertifikasi Halal Self-Declare gratis dengan fasilitator resmi dari BPJPH Kemenag dan Disperindag.',
    date: '2026-03-28',
    time: '08.30 - 13.00 WIB',
    location: 'Aula Kantor Kecamatan Tangerang, Jl. Daan Mogot No. 5',
    organizer: 'Bidang Pembinaan & Legalitas Forum UMKM KUAT',
    posterUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    status: 'terbit',
    targetAudience: 'Pelaku UMKM Kuliner se-Kecamatan Tangerang yang belum ber-NIB/Halal',
    registrationUrl: 'https://wa.me/6285880942565?text=Daftar%20Workshop%20NIB%20Halal',
    createdAt: '2026-02-10T09:30:00Z',
    updatedAt: '2026-02-20T10:00:00Z',
  },
  {
    id: 'evt-003',
    title: 'Pelatihan Fotografi Produk dengan Smartphone & Optimasi Marketplace',
    description: 'Trik praktis membuat foto produk berkelas studio hanya menggunakan smartphone, editing canva, dan strategi pasang iklan di Shopee serta TikTok Shop.',
    date: '2026-04-12',
    time: '09.00 - 15.00 WIB',
    location: 'Ruang Kolaborasi Gedung Cisadane Lantai 2',
    organizer: 'Divisi Kreatif & Digitalisasi Forum UMKM KUAT',
    posterUrl: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=800&q=80',
    status: 'terbit',
    targetAudience: 'Pelaku UMKM Anggota Forum UMKM KUAT',
    createdAt: '2026-02-25T11:00:00Z',
    updatedAt: '2026-02-25T11:00:00Z',
  },
];

export const INITIAL_ARTICLES: Article[] = [
  {
    id: 'art-001',
    title: 'Camat Tangerang Resmikan Galeri & Pojok UMKM KUAT di Kantor Kecamatan',
    excerpt: 'Langkah nyata pemerintah Kecamatan Tangerang dalam memfasilitasi promosi dan etalase produk unggulan 8 kelurahan.',
    content: `Kecamatan Tangerang kembali menunjukkan komitmennya dalam mendorong kebangkitan ekonomi kerakyatan dengan meresmikan Galeri & Pojok UMKM KUAT di lobi utama Kantor Kecamatan Tangerang.

Fasilitas ini bertujuan sebagai ruang pamer representatif bagi produk binaan Forum UMKM KUAT dari delapan kelurahan, mulai dari Babakan, Buaran Indah, Cikokol, Kelapa Indah, Suka Asih, Sukarasa, Sukasari, hingga Tanah Tinggi.

Ketua Forum UMKM KUAT Kecamatan Tangerang menyampaikan apresiasi setinggi-tingginya kepada Camat Tangerang beserta jajaran atas sinergi tanpa henti. "Dengan adanya Pojok UMKM ini, setiap warga yang mengurus perizinan atau layanan administrasi di kantor kecamatan dapat langsung melihat dan membeli produk lokal karya tetangga mereka sendiri," tuturnya.`,
    category: 'Kabar Kecamatan',
    author: 'Tim Humas Forum UMKM KUAT',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    publishedDate: '2026-02-20',
    status: 'terbit',
    createdAt: '2026-02-20T08:00:00Z',
    updatedAt: '2026-02-20T08:00:00Z',
  },
  {
    id: 'art-002',
    title: 'Panduan Praktis: Cara Mendapatkan Sertifikasi Halal Gratis (SEHATI) 2026',
    excerpt: 'Ketahui syarat mudah, alur pendaftaran, dan pendampingan yang disediakan Forum UMKM KUAT bagi pelaku usaha kuliner.',
    content: `Sertifikasi halal kini menjadi kebutuhan penting bagi konsumen modern dan membuka pintu akses pasar ritel modern serta ekspor. Bagi pelaku UMKM dengan proses produksi sederhana, Kementerian Agama melalui BPJPH kembali menggelar program Sertifikasi Halal Gratis (SEHATI).

Forum UMKM KUAT Kecamatan Tangerang telah menyiapkan tim pendamping proses produk halal (PPH) berlisensi yang siap membimbing anggota dari awal input dokumen SiHalal hingga terbitnya sertifikat.

Syarat utama:
1. Memiliki NIB berbasis risiko (KBLI mikro/kecil).
2. Menggunakan bahan-bahan yang sudah dipastikan kehalalannya (bersertifikat halal atau bahan alam segar).
3. Proses pengolahan higienis dan terpisah dari kontaminasi non-halal.
4. Bersedia didampingi oleh petugas PPH Forum UMKM KUAT.`,
    category: 'Edukasi Bisnis',
    author: 'Divisi Legalitas & Halal',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
    publishedDate: '2026-02-25',
    status: 'terbit',
    createdAt: '2026-02-25T10:00:00Z',
    updatedAt: '2026-02-25T10:00:00Z',
  },
  {
    id: 'art-003',
    title: 'Strategi UMKM Tangerang Tembus Ritel Modern dan Bazar Cisadane',
    excerpt: 'Perbaiki kemasan, lengkapi legalitas, dan manfaatkan jejaring komunitas untuk scale-up omset berkali lipat.',
    content: `Banyak pelaku usaha kecil yang memproduksi makanan lezat atau kerajinan tangan berkualitas tinggi, tetapi kesulitan menembus pasar skala besar karena kendala kemasan dan legalitas.

Melalui program kurasi berkala di Forum UMKM KUAT, para anggota diberikan pendampingan perbaikan packaging tahan kedap udara, desain label dengan standar BPOM, serta pencantuman barcode dan tanggal kedaluwarsa.

Dengan jejaring yang kuat di 8 kelurahan se-Kecamatan Tangerang, peluang kolaborasi antar anggota semakin terbuka lebar.`,
    category: 'Inspirasi Usaha',
    author: 'Emus Muslihant',
    imageUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80',
    publishedDate: '2026-03-01',
    status: 'terbit',
    createdAt: '2026-03-01T11:00:00Z',
    updatedAt: '2026-03-01T11:00:00Z',
  },
];

export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log-001',
    userId: 'usr-admin-1',
    userName: 'Super Admin UMKM KUAT',
    action: 'Inisialisasi Sistem',
    target: 'Sistem UMKM Management',
    details: 'Database Firestore dan konfigurasi peran pengguna berhasil diaktifkan',
    timestamp: '2026-03-01T08:00:00Z',
  },
  {
    id: 'log-002',
    userId: 'usr-bendahara',
    userName: 'Hj. Mardiah (Bendahara)',
    action: 'Pencatatan Keuangan',
    target: 'TRX-2026-007',
    details: 'Menambahkan pemasukan sponsorship kemitraan BJB Rp 3.500.000',
    timestamp: '2026-03-02T11:30:00Z',
  },
  {
    id: 'log-003',
    userId: 'usr-keanggotaan',
    userName: 'Admin Keanggotaan',
    action: 'Pendaftaran Anggota',
    target: 'KUAT-TNG-2026-010',
    details: 'Mendaftarkan anggota baru Winda Aryani (Tanah Tinggi)',
    timestamp: '2026-03-03T10:15:00Z',
  },
];

export const INITIAL_ORG_STRUCTURE: OrgStructureMember[] = [
  {
    id: 'org-001',
    role: 'Pelindung',
    name: 'Riswan Setyo Kardinto, S.STP',
    title: 'Camat Kecamatan Tangerang',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    order: 1,
  },
  {
    id: 'org-002',
    role: 'Penasihat',
    name: 'Ibu Hj. DEWI SUBARSIH',
    title: 'Tokoh Penggerak & Pembina UMKM Kota Tangerang',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    order: 2,
  },
  {
    id: 'org-003',
    role: 'Ketua',
    name: 'EMus Muslihant',
    title: 'Ketua Forum UMKM KUAT Kecamatan Tangerang',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    order: 3,
  },
  {
    id: 'org-004',
    role: 'Wakil Ketua',
    name: 'Ferry Juni Purwanto',
    title: 'Koordinator Pengembangan Usaha & Kemitraan',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    order: 4,
  },
  {
    id: 'org-005',
    role: 'Sekretaris',
    name: 'DIna Fatrian S.I.Kom',
    title: 'Administrasi, Kesekretariatan & Kehumasan',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    order: 5,
  },
  {
    id: 'org-006',
    role: 'Bendahara',
    name: 'Peni Martin',
    title: 'Pengelolaan Kas, Iuran & Keuangan Forum',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    order: 6,
  },
];

export const INITIAL_VISION_MISSION: OrgVisionMission = {
  vision: 'Terwujudnya pelaku UMKM Kecamatan Tangerang yang mandiri, berdaya saing tinggi, tertib legalitas, dan menjadi motor penggerak perekonomian masyarakat yang inklusif serta berkelanjutan.',
  missions: [
    'Meningkatkan daya saing dan standar mutu produk UMKM di 8 kelurahan se-Kecamatan Tangerang.',
    'Memfasilitasi kepemilikan legalitas usaha (NIB, Sertifikasi Halal, P-IRT, dan HKI) secara mudah, cepat, dan transparan.',
    'Membangun akses permodalan, kemitraan strategis perbankan, dan fasilitasi pembayaran digital QRIS.',
    'Mendorong digitalisasi pemasaran melalui katalog online, media sosial, dan marketplace nasional.',
    'Menyelenggarakan kegiatan bazar berkala, temu bisnis, dan pameran produk unggulan Cisadane.',
  ],
};

export const INITIAL_CONTACT_INFO: OrgContactInfo = {
  officeName: 'Kantor Kecamatan Tangerang',
  subTitle: 'Pemerintah Kota Tangerang, Provinsi Banten',
  address: 'Gedung Kantor Kecamatan Tangerang (Lantai Dasar & Pojok UMKM), Jl. Daan Mogot No. 5, Kelurahan Sukarasa, Kec. Tangerang, Kota Tangerang, Banten 15111',
  phone: '(021) 5523456',
  whatsapp: '085880942565',
  email: 'umkmkectangerang@gmail.com',
  operatingHours: 'Senin – Jumat: 08.00 – 16.00 WIB',
  googleMapsUrl: 'https://maps.google.com/?q=Kantor+Kecamatan+Tangerang',
  instagram: '@umkmkuattangerang',
  facebook: 'Forum UMKM KUAT Kec Tangerang',
};

export const INITIAL_USERS: UserProfile[] = [
  {
    uid: 'usr-admin-01',
    email: 'umkmkectangerang@gmail.com',
    displayName: 'Riswan Setyo Kardinto, S.STP',
    role: 'super_admin',
    kelurahan: 'Semua Kelurahan (Kecamatan)',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    uid: 'usr-ketua-02',
    email: 'ketua.umkm@tangerangkota.go.id',
    displayName: 'EMus Muslihant',
    role: 'pengurus_kecamatan',
    kelurahan: 'Semua Kelurahan (Kecamatan)',
    createdAt: '2026-01-05T08:00:00Z',
  },
  {
    uid: 'usr-keanggotaan-03',
    email: 'keanggotaan@umkmkuat-tangerang.org',
    displayName: 'Ferry Juni Purwanto',
    role: 'admin_keanggotaan',
    kelurahan: 'Semua Kelurahan (Kecamatan)',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    uid: 'usr-bendahara-04',
    email: 'bendahara@umkmkuat-tangerang.org',
    displayName: 'Peni Martin',
    role: 'bendahara',
    kelurahan: 'Semua Kelurahan (Kecamatan)',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    uid: 'usr-informasi-05',
    email: 'informasi@umkmkuat-tangerang.org',
    displayName: 'DIna Fatrian S.I.Kom',
    role: 'admin_informasi',
    kelurahan: 'Semua Kelurahan (Kecamatan)',
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    uid: 'usr-babakan-06',
    email: 'babakan@umkmkuat-tangerang.org',
    displayName: 'Koordinator UMKM Babakan',
    role: 'pengurus_kelurahan',
    kelurahan: 'Babakan',
    createdAt: '2026-01-20T08:00:00Z',
  },
];

// Helper to load or persist items with local cache fallbacks
const LOCAL_STORAGE_PREFIX = 'umkm_mgmt_';

// Helper to remove any undefined values before writing to Firestore
function cleanFirestoreData<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

function getLocalData<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    return defaultValue;
  }
}

function setLocalData<T>(key: string, data: T) {
  try {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.error('LocalStorage error: ', e);
  }
}

// Data service methods
export const dbService = {
  // Clear all members and transactions completely
  async clearAllMembersAndTransactions(): Promise<void> {
    try {
      const memSnap = await Promise.race([
        getDocs(collection(db, 'members')),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]);
      if (memSnap?.docs) {
        for (const d of memSnap.docs) {
          await deleteDoc(d.ref).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Error clearing members in Firestore:', e);
    }

    try {
      const trxSnap = await Promise.race([
        getDocs(collection(db, 'transactions')),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]);
      if (trxSnap?.docs) {
        for (const d of trxSnap.docs) {
          await deleteDoc(d.ref).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Error clearing transactions in Firestore:', e);
    }

    setLocalData('members', []);
    setLocalData('transactions', []);
  },

  // Realtime subscription: ensures mobile phones (HP) and computers instantly sync without refresh
  subscribeMembers(callback: (members: Member[]) => void): () => void {
    try {
      const q = collection(db, 'members');
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: Member[] = [];
          snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Member, 'id'>) }));
          list.sort((a, b) => (a.memberNumber || '').localeCompare(b.memberNumber || ''));
          setLocalData('members', list);
          callback(list);
        },
        (err) => {
          console.warn('Realtime members listener warning:', err);
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn('Subscribe members error:', e);
      return () => {};
    }
  },

  // MEMBERS
  async getMembers(): Promise<Member[]> {
    try {
      const snapshot = await Promise.race([
        getDocs(collection(db, 'members')),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000))
      ]);
      if (snapshot) {
        const list: Member[] = [];
        snapshot.forEach((d: any) => list.push({ id: d.id, ...(d.data() as Omit<Member, 'id'>) }));
        list.sort((a, b) => (a.memberNumber || '').localeCompare(b.memberNumber || ''));
        setLocalData('members', list);
        return list;
      }
    } catch (err) {
      console.warn('Firestore fetch failed, using local cache:', err);
    }
    // Fallback to local storage (never re-injects dummy items)
    return getLocalData<Member[]>('members', []);
  },

  async saveMember(member: Member): Promise<void> {
    const cleaned = cleanFirestoreData(member);

    // 1. Immediately update local storage and notify listeners
    const current = getLocalData<Member[]>('members', []);
    const idx = current.findIndex((m) => m.id === cleaned.id);
    if (idx >= 0) {
      current[idx] = cleaned;
    } else {
      current.push(cleaned);
    }
    setLocalData('members', current);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('umkm_members_updated', { detail: current }));
    }

    // 2. Persist to Firestore
    try {
      const writePromise = setDoc(doc(db, 'members', cleaned.id), cleaned);
      await Promise.race([
        writePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
      ]);
    } catch (err) {
      console.warn('Firestore write failed, stored in local storage:', err);
    }
  },

  async deleteMember(id: string): Promise<void> {
    // 1. Immediately update local storage and notify listeners
    const current = getLocalData<Member[]>('members', []);
    const updated = current.filter((m) => m.id !== id);
    setLocalData('members', updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('umkm_members_updated', { detail: updated }));
    }

    // 2. Delete from Firestore
    try {
      const delPromise = deleteDoc(doc(db, 'members', id));
      await Promise.race([
        delPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
      ]);
    } catch (err) {
      console.warn('Firestore delete failed:', err);
    }
  },

  // TRANSACTIONS
  async getTransactions(): Promise<Transaction[]> {
    try {
      const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
      const snapshot = await Promise.race([
        getDocs(q),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
      ]);
      if (snapshot && !snapshot.empty) {
        const list: Transaction[] = [];
        snapshot.forEach((d: any) => list.push({ id: d.id, ...(d.data() as Omit<Transaction, 'id'>) }));
        setLocalData('transactions', list);
        return list;
      } else if (snapshot && snapshot.empty) {
        setLocalData('transactions', []);
        return [];
      }
    } catch (err) {
      console.warn('Firestore getTransactions failed, using local cache:', err);
    }
    return getLocalData<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
  },

  async saveTransaction(trx: Transaction): Promise<void> {
    try {
      await setDoc(doc(db, 'transactions', trx.id), trx);
    } catch (err) {
      console.warn('Firestore saveTransaction failed:', err);
    }
    const current = await this.getTransactions();
    const idx = current.findIndex((t) => t.id === trx.id);
    if (idx >= 0) {
      current[idx] = trx;
    } else {
      current.unshift(trx);
    }
    setLocalData('transactions', current);
  },

  async deleteTransaction(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (err) {
      console.warn('Firestore deleteTransaction failed:', err);
    }
    const current = await this.getTransactions();
    const updated = current.filter((t) => t.id !== id);
    setLocalData('transactions', updated);
  },

  // EVENTS
  async getEvents(): Promise<ForumEvent[]> {
    try {
      const q = query(collection(db, 'events'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const list: ForumEvent[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<ForumEvent, 'id'>) }));
        setLocalData('events', list);
        return list;
      }
    } catch (err) {
      console.warn('Firestore getEvents failed:', err);
    }
    return getLocalData<ForumEvent[]>('events', INITIAL_EVENTS);
  },

  async saveEvent(event: ForumEvent): Promise<void> {
    try {
      await setDoc(doc(db, 'events', event.id), event);
    } catch (err) {
      console.warn('Firestore saveEvent failed:', err);
    }
    const current = await this.getEvents();
    const idx = current.findIndex((e) => e.id === event.id);
    if (idx >= 0) {
      current[idx] = event;
    } else {
      current.unshift(event);
    }
    setLocalData('events', current);
  },

  async deleteEvent(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (err) {
      console.warn('Firestore deleteEvent failed:', err);
    }
    const current = await this.getEvents();
    setLocalData('events', current.filter((e) => e.id !== id));
  },

  // ARTICLES
  async getArticles(): Promise<Article[]> {
    try {
      const q = query(collection(db, 'articles'), orderBy('publishedDate', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const list: Article[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Article, 'id'>) }));
        setLocalData('articles', list);
        return list;
      }
    } catch (err) {
      console.warn('Firestore getArticles failed:', err);
    }
    return getLocalData<Article[]>('articles', INITIAL_ARTICLES);
  },

  async saveArticle(article: Article): Promise<void> {
    try {
      await setDoc(doc(db, 'articles', article.id), article);
    } catch (err) {
      console.warn('Firestore saveArticle failed:', err);
    }
    const current = await this.getArticles();
    const idx = current.findIndex((a) => a.id === article.id);
    if (idx >= 0) {
      current[idx] = article;
    } else {
      current.unshift(article);
    }
    setLocalData('articles', current);
  },

  async deleteArticle(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'articles', id));
    } catch (err) {
      console.warn('Firestore deleteArticle failed:', err);
    }
    const current = await this.getArticles();
    setLocalData('articles', current.filter((a) => a.id !== id));
  },

  // ACTIVITY LOGS
  async getLogs(): Promise<ActivityLog[]> {
    try {
      const q = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const list: ActivityLog[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<ActivityLog, 'id'>) }));
        setLocalData('activity_logs', list);
        return list;
      }
    } catch (err) {
      console.warn('Firestore getLogs failed:', err);
    }
    return getLocalData<ActivityLog[]>('activity_logs', INITIAL_LOGS);
  },

  async addLog(log: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
    const newLog: ActivityLog = {
      ...log,
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'activity_logs', newLog.id), newLog);
    } catch (err) {
      console.warn('Firestore addLog failed:', err);
    }
    const current = await this.getLogs();
    current.unshift(newLog);
    setLocalData('activity_logs', current.slice(0, 50)); // Keep recent 50
  },

  // ORGANIZATION STRUCTURE (Struktur Pengurus Organisasi)
  getCachedOrgStructure(): OrgStructureMember[] {
    return getLocalData<OrgStructureMember[]>('org_structure', INITIAL_ORG_STRUCTURE);
  },

  async getOrgStructure(): Promise<OrgStructureMember[]> {
    const local = this.getCachedOrgStructure();
    try {
      const q = query(collection(db, 'org_structure'), orderBy('order', 'asc'));
      const snapshot = await Promise.race([
        getDocs(q),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500)),
      ]);
      if (snapshot && !snapshot.empty) {
        const remoteList: OrgStructureMember[] = [];
        snapshot.forEach((d) => remoteList.push({ id: d.id, ...(d.data() as Omit<OrgStructureMember, 'id'>) }));
        const sorted = remoteList.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
        setLocalData('org_structure', sorted);
        return sorted;
      }
    } catch (err) {
      console.warn('Firestore getOrgStructure fallback to local cache:', err);
    }
    return local;
  },

  async saveOrgStructureMember(member: OrgStructureMember): Promise<void> {
    const payload: OrgStructureMember = {
      ...member,
      updatedAt: new Date().toISOString(),
    };

    // 1. Immediately update local storage so data is never lost regardless of network state
    const current = getLocalData<OrgStructureMember[]>('org_structure', INITIAL_ORG_STRUCTURE);
    const idx = current.findIndex((m) => m.id === member.id);
    if (idx >= 0) {
      current[idx] = payload;
    } else {
      current.push(payload);
    }
    current.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    setLocalData('org_structure', current);

    // Notify all open components and pages immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('umkm_org_structure_updated', { detail: current }));
    }

    // 2. Persist to Firestore with generous timeout
    try {
      const writePromise = setDoc(doc(db, 'org_structure', member.id), payload);
      await Promise.race([
        writePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
      ]);
    } catch (err) {
      console.warn('Firestore saveOrgStructureMember fallback to local:', err);
    }
  },

  async deleteOrgStructureMember(id: string): Promise<void> {
    // 1. Immediately update local storage
    const current = getLocalData<OrgStructureMember[]>('org_structure', INITIAL_ORG_STRUCTURE);
    const updated = current.filter((m) => m.id !== id);
    setLocalData('org_structure', updated);

    // 2. Delete from Firestore
    try {
      const delPromise = deleteDoc(doc(db, 'org_structure', id));
      await Promise.race([
        delPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
      ]);
    } catch (err) {
      console.warn('Firestore deleteOrgStructureMember fallback to local:', err);
    }
  },

  // USER MANAGEMENT & HAK AKSES (RBAC)
  async getUsers(): Promise<UserProfile[]> {
    const local = getLocalData<UserProfile[]>('users', INITIAL_USERS);
    try {
      const q = query(collection(db, 'users'));
      const snapshot = await Promise.race([
        getDocs(q),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
      ]);
      if (snapshot && !snapshot.empty) {
        const list: UserProfile[] = [];
        snapshot.forEach((d) => list.push({ uid: d.id, ...(d.data() as Omit<UserProfile, 'uid'>) }));
        setLocalData('users', list);
        return list;
      }
    } catch (err) {
      console.warn('Firestore getUsers fallback to local cache:', err);
    }
    return local;
  },

  async saveUserProfile(user: UserProfile): Promise<void> {
    const payload: UserProfile = {
      ...user,
      updatedAt: new Date().toISOString(),
    };

    // 1. Immediately update local storage
    const current = getLocalData<UserProfile[]>('users', INITIAL_USERS);
    const idx = current.findIndex((u) => u.uid === user.uid || u.email.toLowerCase() === user.email.toLowerCase());
    if (idx >= 0) {
      current[idx] = payload;
    } else {
      current.push(payload);
    }
    setLocalData('users', current);

    // 2. Persist to Firestore
    try {
      const writePromise = setDoc(doc(db, 'users', user.uid), payload);
      await Promise.race([
        writePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
      ]);
    } catch (err) {
      console.warn('Firestore saveUserProfile fallback to local:', err);
    }
  },

  async deleteUserProfile(uid: string): Promise<void> {
    // 1. Immediately update local storage
    const current = getLocalData<UserProfile[]>('users', INITIAL_USERS);
    const updated = current.filter((u) => u.uid !== uid);
    setLocalData('users', updated);

    // 2. Delete from Firestore
    try {
      const delPromise = deleteDoc(doc(db, 'users', uid));
      await Promise.race([
        delPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
      ]);
    } catch (err) {
      console.warn('Firestore deleteUserProfile fallback to local:', err);
    }
  },

  // VISI & MISI ORGANISASI
  getCachedVisionMission(): OrgVisionMission {
    return getLocalData<OrgVisionMission>('vision_mission', INITIAL_VISION_MISSION);
  },

  async getVisionMission(): Promise<OrgVisionMission> {
    const local = this.getCachedVisionMission();
    try {
      const docSnap = await Promise.race([
        getDoc(doc(db, 'org_settings', 'vision_mission')),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
      ]);
      if (docSnap && docSnap.exists()) {
        const data = docSnap.data() as OrgVisionMission;
        setLocalData('vision_mission', data);
        return data;
      }
    } catch (err) {
      console.warn('Firestore getVisionMission fallback to local cache:', err);
    }
    return local || INITIAL_VISION_MISSION;
  },

  async saveVisionMission(data: OrgVisionMission): Promise<void> {
    const payload: OrgVisionMission = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    try {
      const writePromise = setDoc(doc(db, 'org_settings', 'vision_mission'), payload);
      await Promise.race([
        writePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500)),
      ]);
    } catch (err) {
      console.warn('Firestore saveVisionMission fallback to local:', err);
    }
    setLocalData('vision_mission', payload);
  },

  // CONTACT & SERVICES SETTINGS
  async getContactInfo(): Promise<OrgContactInfo> {
    const local = getLocalData<OrgContactInfo | null>('contact_info', null);
    try {
      const docRef = doc(db, 'org_settings', 'contact_info');
      const docSnap = await Promise.race([
        getDoc(docRef),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
      ]);
      if (docSnap && docSnap.exists()) {
        const data = docSnap.data() as OrgContactInfo;
        setLocalData('contact_info', data);
        return data;
      }
    } catch (err) {
      console.warn('Firestore getContactInfo fallback to local cache:', err);
    }
    return local || INITIAL_CONTACT_INFO;
  },

  async saveContactInfo(data: OrgContactInfo): Promise<void> {
    const payload: OrgContactInfo = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    try {
      const writePromise = setDoc(doc(db, 'org_settings', 'contact_info'), payload);
      await Promise.race([
        writePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500)),
      ]);
    } catch (err) {
      console.warn('Firestore saveContactInfo fallback to local:', err);
    }
    setLocalData('contact_info', payload);
  },

  // DATA BACKUP & RESTORE
  async exportFullBackup(): Promise<string> {
    const [members, transactions, events, articles, logs, orgStructure, visionMission, contactInfo, users] = await Promise.all([
      this.getMembers(),
      this.getTransactions(),
      this.getEvents(),
      this.getArticles(),
      this.getLogs(),
      this.getOrgStructure(),
      this.getVisionMission(),
      this.getContactInfo(),
      this.getUsers(),
    ]);

    const backup = {
      appName: 'UMKM MANAGEMENT - Forum UMKM KUAT Kec. Tangerang',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        members,
        transactions,
        events,
        articles,
        logs,
        orgStructure,
        visionMission,
        contactInfo,
        users,
      },
    };
    return JSON.stringify(backup, null, 2);
  },

  async importBackup(jsonString: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data) throw new Error('Format cadangan tidak valid');
      const { members, transactions, events, articles, logs, orgStructure, visionMission, contactInfo, users } = parsed.data;

      if (Array.isArray(members)) setLocalData('members', members);
      if (Array.isArray(transactions)) setLocalData('transactions', transactions);
      if (Array.isArray(events)) setLocalData('events', events);
      if (Array.isArray(articles)) setLocalData('articles', articles);
      if (Array.isArray(logs)) setLocalData('activity_logs', logs);
      if (Array.isArray(orgStructure)) setLocalData('org_structure', orgStructure);
      if (visionMission && typeof visionMission === 'object') setLocalData('vision_mission', visionMission);
      if (contactInfo && typeof contactInfo === 'object') setLocalData('contact_info', contactInfo);
      if (Array.isArray(users)) setLocalData('users', users);

      return true;
    } catch (err) {
      console.error('Import failed:', err);
      return false;
    }
  },

  // Reset to initial demo data
  resetDemoData() {
    setLocalData('members', INITIAL_MEMBERS);
    setLocalData('transactions', INITIAL_TRANSACTIONS);
    setLocalData('events', INITIAL_EVENTS);
    setLocalData('articles', INITIAL_ARTICLES);
    setLocalData('activity_logs', INITIAL_LOGS);
    setLocalData('org_structure', INITIAL_ORG_STRUCTURE);
    setLocalData('vision_mission', INITIAL_VISION_MISSION);
    setLocalData('contact_info', INITIAL_CONTACT_INFO);
    setLocalData('users', INITIAL_USERS);
  },
};
