import {
  Member,
  ForumEvent,
  Article,
  Transaction,
  OrgStructureMember,
  OrgContactInfo,
  OrgVisionMission,
  UserProfile,
  UserRole,
} from '../types';

export const SECURITY_LIMITS = {
  MAX_IMAGE_FILE_BYTES: 5 * 1024 * 1024, // 5 MB sebelum kompresi
  MAX_COMPRESSED_DATA_URL_BYTES: 800 * 1024, // 800 KB agar aman di bawah limit 1MB dokumen Firestore
  MAX_EXCEL_FILE_BYTES: 5 * 1024 * 1024, // 5 MB file Excel
  MAX_BULK_IMPORT_ROWS: 500, // Batas maksimal baris sekali import Excel (batas biaya cloud)
  MAX_JSON_BODY_BYTES: 1024 * 1024, // 1 MB payload API
  RATE_LIMIT_MAX_REQUESTS_PER_MIN: 30, // Maksimal 30 request per menit per IP/User
} as const;

const VALID_ROLES: UserRole[] = [
  'super_admin',
  'pengurus_kecamatan',
  'admin_keanggotaan',
  'bendahara',
  'admin_informasi',
  'pengurus_kelurahan',
  'member',
];

/**
 * Membersihkan input teks dari karakter berbahaya & potensi XSS
 * (<script>, tag HTML, event handler inline on*=, skema javascript:/vbscript:, null byte).
 */
export function sanitizeText(input: unknown, maxLength = 500): string {
  if (input === null || input === undefined) return '';
  let str = typeof input === 'string' ? input : String(input);

  // Hapus null byte & karakter kontrol non-cetak (kecuali newline/tab untuk deskripsi panjang)
  str = str.replace(/\0/g, '').replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Hapus blok <script>, <style>, <iframe>, <object>, <embed>, <svg> berbahaya beserta isinya
  str = str
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<(iframe|object|embed|applet|meta|link|base)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(iframe|object|embed|applet|meta|link|base)\b[^>]*\/?>/gi, '');

  // Hapus seluruh tag HTML yang tersisa dan pola event handler / URI berbahaya
  str = str
    .replace(/<\/?[a-zA-Z][^>]*>/g, '')
    .replace(/\bon[a-zA-Z]+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\bon[a-zA-Z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/(javascript|vbscript|data\s*:\s*text\/html)\s*:/gi, '');

  str = str.trim();
  if (maxLength > 0 && str.length > maxLength) {
    str = str.slice(0, maxLength).trim();
  }
  return str;
}

/**
 * Validasi & sanitasi URL aman (hanya izinkan https://, http://, path relatif /..., atau data:image/* jika diizinkan).
 */
export function sanitizeUrl(
  input: unknown,
  options: { allowDataImage?: boolean; maxLength?: number } = {}
): { valid: boolean; value: string; error?: string } {
  const { allowDataImage = true, maxLength = 1000 } = options;
  if (input === null || input === undefined) return { valid: true, value: '' };
  const raw = String(input).replace(/\0/g, '').trim();
  if (!raw) return { valid: true, value: '' };

  const lower = raw.toLowerCase().replace(/\s+/g, '');
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('data:text/html') ||
    lower.startsWith('data:application/')
  ) {
    return { valid: false, value: '', error: 'URL mengandung skema berbahaya yang dilarang.' };
  }

  // Izinkan Data URL gambar yang aman dan ukurannya terkendali
  if (lower.startsWith('data:image/')) {
    if (!allowDataImage) {
      return { valid: false, value: '', error: 'Format Data URL tidak diizinkan pada kolom ini.' };
    }
    const isAllowedImageMime = /^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);(base64|utf8),/i.test(raw);
    if (!isAllowedImageMime) {
      return { valid: false, value: '', error: 'Format gambar Data URL tidak didukung.' };
    }
    if (raw.length > SECURITY_LIMITS.MAX_COMPRESSED_DATA_URL_BYTES) {
      return {
        valid: false,
        value: '',
        error: 'Ukuran file gambar melebihi batas maksimal (800 KB setelah kompresi).',
      };
    }
    return { valid: true, value: raw };
  }

  // Path lokal aplikasi
  if (raw.startsWith('/') && !raw.startsWith('//')) {
    return { valid: true, value: raw.slice(0, maxLength) };
  }

  // HTTP / HTTPS URL atau handle media sosial
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { valid: false, value: '', error: 'Protokol URL harus http atau https.' };
    }
    return { valid: true, value: raw.slice(0, maxLength) };
  } catch {
    return { valid: false, value: '', error: 'Format URL tidak valid.' };
  }
}

/**
 * Validasi ketat NIK: wajib tepat 16 digit angka.
 */
export function validateNIK(nik: unknown): { valid: boolean; cleaned: string; error?: string } {
  const raw = typeof nik === 'string' || typeof nik === 'number' ? String(nik).trim() : '';
  const digits = raw.replace(/\D/g, '');
  if (!digits) {
    return { valid: false, cleaned: '', error: 'NIK wajib diisi.' };
  }
  if (!/^\d{16}$/.test(digits)) {
    return {
      valid: false,
      cleaned: digits,
      error: `NIK wajib tepat 16 digit angka (terbaca ${digits.length} digit).`,
    };
  }
  return { valid: true, cleaned: digits };
}

/**
 * Validasi ketat format email.
 */
export function validateEmail(
  email: unknown,
  required = false
): { valid: boolean; cleaned: string; error?: string } {
  const cleaned = sanitizeText(email, 150).toLowerCase();
  if (!cleaned) {
    if (required) {
      return { valid: false, cleaned: '', error: 'Alamat email wajib diisi.' };
    }
    return { valid: true, cleaned: '' };
  }
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
  if (!emailRegex.test(cleaned)) {
    return { valid: false, cleaned, error: 'Format alamat email tidak valid (contoh: nama@domain.com).' };
  }
  return { valid: true, cleaned };
}

/**
 * Validasi nomor WhatsApp / HP Indonesia & internasional (9–15 digit angka).
 */
export function validateWhatsAppPhone(
  phone: unknown,
  required = true
): { valid: boolean; cleaned: string; error?: string } {
  const raw = sanitizeText(phone, 30);
  if (!raw) {
    if (required) {
      return { valid: false, cleaned: '', error: 'Nomor WhatsApp / HP wajib diisi.' };
    }
    return { valid: true, cleaned: '' };
  }
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) {
    return {
      valid: false,
      cleaned: raw,
      error: 'Nomor WhatsApp / HP harus terdiri dari 9 hingga 15 digit angka.',
    };
  }
  if (!/^(08|628|8|02|622|[1-9])/.test(digits)) {
    return { valid: false, cleaned: raw, error: 'Format nomor WhatsApp / HP tidak valid.' };
  }
  const normalized = raw.replace(/[^0-9+\-\s()]/g, '').trim();
  return { valid: true, cleaned: normalized };
}

/**
 * Validasi file unggahan di browser (gambar atau Excel).
 */
export function validateUploadedFile(
  file: File,
  kind: 'image' | 'excel'
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'File tidak ditemukan.' };
  }

  if (kind === 'image') {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(file.type.toLowerCase())) {
      return {
        valid: false,
        error: 'Format gambar tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF.',
      };
    }
    if (file.size > SECURITY_LIMITS.MAX_IMAGE_FILE_BYTES) {
      return {
        valid: false,
        error: 'Ukuran file gambar maksimal 5 MB.',
      };
    }
    return { valid: true };
  }

  // Excel (.xlsx, .xls, .csv)
  const lowerName = file.name.toLowerCase();
  const hasValidExt =
    lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv');
  if (!hasValidExt) {
    return {
      valid: false,
      error: 'Format file tidak didukung. Unggah file .xlsx, .xls, atau .csv.',
    };
  }
  if (file.size > SECURITY_LIMITS.MAX_EXCEL_FILE_BYTES) {
    return {
      valid: false,
      error: 'Ukuran file spreadsheet maksimal 5 MB.',
    };
  }
  return { valid: true };
}

export function isValidDocId(id: unknown): id is string {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(id);
}

/**
 * Validasi & sanitasi payload Anggota UMKM secara menyeluruh (dipakai di frontend & backend).
 */
export function validateMemberInput(
  input: Partial<Member>,
  options: { requireValidNik?: boolean } = { requireValidNik: true }
): { valid: boolean; errors: string[]; sanitized: Member } {
  const errors: string[] = [];

  const fullName = sanitizeText(input.fullName, 150);
  if (fullName.length < 2) {
    errors.push('Nama lengkap minimal 2 karakter.');
  }

  const nikCheck = validateNIK(input.nik);
  if (options.requireValidNik && !nikCheck.valid) {
    errors.push(nikCheck.error || 'NIK harus tepat 16 digit angka.');
  }

  const phoneCheck = validateWhatsAppPhone(input.phone, true);
  if (!phoneCheck.valid) {
    errors.push(phoneCheck.error || 'Nomor WhatsApp / HP tidak valid.');
  }

  const emailCheck = validateEmail(input.email, false);
  if (!emailCheck.valid) {
    errors.push(emailCheck.error || 'Format email tidak valid.');
  }

  const address = sanitizeText(input.address, 300);
  if (address.length < 3) {
    errors.push('Alamat domisili KTP minimal 3 karakter.');
  }

  const kelurahan = sanitizeText(input.kelurahan || 'Babakan', 100) || 'Babakan';
  const businessName = sanitizeText(input.businessName, 150);
  if (businessName.length < 2) {
    errors.push('Nama usaha / merk minimal 2 karakter.');
  }

  const category = sanitizeText(input.category || 'Kuliner', 80) || 'Kuliner';
  const topProduct = sanitizeText(input.topProduct, 150);
  if (topProduct.length < 2) {
    errors.push('Produk unggulan minimal 2 karakter.');
  }

  const businessAddress = sanitizeText(input.businessAddress || address, 300) || address;
  const bizPhoneInput = sanitizeText(input.businessPhone, 30) || phoneCheck.cleaned;
  const bizPhoneCheck = validateWhatsAppPhone(bizPhoneInput, true);
  if (!bizPhoneCheck.valid) {
    errors.push(`Kontak WhatsApp usaha: ${bizPhoneCheck.error}`);
  }

  const memberPhotoRes = sanitizeUrl(input.memberPhoto || '', { allowDataImage: true, maxLength: 900000 });
  if (!memberPhotoRes.valid) {
    errors.push(`Pas foto anggota: ${memberPhotoRes.error}`);
  }

  const productPhotoRes = sanitizeUrl(input.productPhoto || '', { allowDataImage: true, maxLength: 900000 });
  if (!productPhotoRes.valid) {
    errors.push(`Foto produk: ${productPhotoRes.error}`);
  }

  const legalities = sanitizeText(input.legalities || '', 300);
  const status: Member['status'] =
    input.status === 'nonaktif' || input.status === 'pending' ? input.status : 'aktif';
  const memberNumber = sanitizeText(input.memberNumber || '', 50);
  const joinDate = sanitizeText(input.joinDate || new Date().toISOString().split('T')[0], 30);
  const nowIso = new Date().toISOString();

  const sanitized: Member = {
    id: isValidDocId(input.id) ? input.id : 'mem-' + Date.now(),
    memberNumber,
    fullName,
    nik: nikCheck.cleaned,
    phone: phoneCheck.cleaned,
    email: emailCheck.cleaned,
    address,
    kelurahan,
    status,
    joinDate,
    businessName,
    category,
    topProduct,
    businessAddress,
    businessPhone: bizPhoneCheck.cleaned || phoneCheck.cleaned,
    memberPhoto: memberPhotoRes.value,
    productPhoto: productPhotoRes.value,
    legalities,
    isPublicDirectory: input.isPublicDirectory !== false,
    createdAt: sanitizeText(input.createdAt || nowIso, 50) || nowIso,
    updatedAt: nowIso,
  };

  return { valid: errors.length === 0, errors, sanitized };
}

export function validateEventInput(input: Partial<ForumEvent>): {
  valid: boolean;
  errors: string[];
  sanitized: ForumEvent;
} {
  const errors: string[] = [];
  const title = sanitizeText(input.title, 200);
  if (title.length < 3) errors.push('Judul agenda minimal 3 karakter.');

  const description = sanitizeText(input.description, 3000);
  if (description.length < 3) errors.push('Deskripsi agenda wajib diisi.');

  const date = sanitizeText(input.date, 30);
  if (!date) errors.push('Tanggal agenda wajib diisi.');

  const time = sanitizeText(input.time, 50);
  const location = sanitizeText(input.location, 250);
  if (location.length < 2) errors.push('Lokasi kegiatan wajib diisi.');

  const organizer = sanitizeText(input.organizer || 'Forum UMKM KUAT Kecamatan Tangerang', 150);
  const posterRes = sanitizeUrl(input.posterUrl || '', { allowDataImage: true, maxLength: 900000 });
  if (!posterRes.valid) errors.push(`URL gambar poster: ${posterRes.error}`);

  const registrationRes = sanitizeUrl(input.registrationUrl || '', { allowDataImage: false, maxLength: 300 });
  if (!registrationRes.valid) errors.push(`URL pendaftaran: ${registrationRes.error}`);

  const documentationUrls = sanitizeText(input.documentationUrls || '', 1000);
  const targetAudience = sanitizeText(input.targetAudience || '', 150);
  const allowedStatus: ForumEvent['status'][] = ['terbit', 'draf', 'arsip', 'selesai'];
  const status = allowedStatus.includes(input.status as ForumEvent['status'])
    ? (input.status as ForumEvent['status'])
    : 'terbit';
  const nowIso = new Date().toISOString();

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      id: isValidDocId(input.id) ? input.id : 'evt-' + Date.now(),
      title,
      description,
      date,
      time,
      location,
      organizer,
      posterUrl: posterRes.value,
      documentationUrls,
      status,
      targetAudience,
      registrationUrl: registrationRes.value,
      createdAt: sanitizeText(input.createdAt || nowIso, 50) || nowIso,
      updatedAt: nowIso,
    },
  };
}

export function validateArticleInput(input: Partial<Article>): {
  valid: boolean;
  errors: string[];
  sanitized: Article;
} {
  const errors: string[] = [];
  const title = sanitizeText(input.title, 250);
  if (title.length < 3) errors.push('Judul berita minimal 3 karakter.');

  const excerpt = sanitizeText(input.excerpt, 400);
  const content = sanitizeText(input.content, 10000);
  if (content.length < 10) errors.push('Konten artikel minimal 10 karakter.');

  const category = sanitizeText(input.category || 'Kabar Kecamatan', 80);
  const author = sanitizeText(input.author || 'Tim Redaksi Forum UMKM KUAT', 150);
  const imageRes = sanitizeUrl(input.imageUrl || '', { allowDataImage: true, maxLength: 900000 });
  if (!imageRes.valid) errors.push(`Gambar sampul berita: ${imageRes.error}`);

  const publishedDate = sanitizeText(input.publishedDate || new Date().toISOString().split('T')[0], 30);
  const allowedStatus: Article['status'][] = ['terbit', 'draf', 'arsip'];
  const status = allowedStatus.includes(input.status as Article['status'])
    ? (input.status as Article['status'])
    : 'terbit';
  const nowIso = new Date().toISOString();

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      id: isValidDocId(input.id) ? input.id : 'art-' + Date.now(),
      title,
      excerpt: excerpt || content.slice(0, 180),
      content,
      category,
      author,
      authorId: sanitizeText(input.authorId || '', 128),
      imageUrl: imageRes.value,
      publishedDate,
      status,
      createdAt: sanitizeText(input.createdAt || nowIso, 50) || nowIso,
      updatedAt: nowIso,
    },
  };
}

export function validateTransactionInput(input: Partial<Transaction>): {
  valid: boolean;
  errors: string[];
  sanitized: Transaction;
} {
  const errors: string[] = [];
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000_000) {
    errors.push('Nominal transaksi harus berupa angka positif yang valid.');
  }

  const description = sanitizeText(input.description, 500);
  if (description.length < 2) errors.push('Keterangan transaksi wajib diisi.');

  const category = sanitizeText(input.category, 100);
  if (!category) errors.push('Kategori transaksi wajib diisi.');

  const proofRes = sanitizeUrl(input.proofUrl || '', { allowDataImage: true, maxLength: 900000 });
  if (!proofRes.valid) errors.push(`Bukti transaksi: ${proofRes.error}`);

  const type: Transaction['type'] = input.type === 'pengeluaran' ? 'pengeluaran' : 'pemasukan';
  const approvalStatus: Transaction['approvalStatus'] =
    input.approvalStatus === 'menunggu' || input.approvalStatus === 'ditolak'
      ? input.approvalStatus
      : 'disetujui';
  const memberId = type === 'pemasukan' ? sanitizeText(input.memberId || '', 128) : '';
  const memberName = type === 'pemasukan' ? sanitizeText(input.memberName || '', 150) : '';
  const memberNumber = type === 'pemasukan' ? sanitizeText(input.memberNumber || '', 50) : '';
  const nowIso = new Date().toISOString();

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      id: isValidDocId(input.id) ? input.id : 'trx-' + Date.now(),
      transactionNumber: sanitizeText(input.transactionNumber, 50),
      type,
      category,
      date: sanitizeText(input.date || nowIso.split('T')[0], 30),
      amount: Math.round(amount),
      description,
      recorderName: sanitizeText(input.recorderName || 'Bendahara', 150),
      recorderId: sanitizeText(input.recorderId || 'usr-bendahara', 128),
      approvalStatus,
      approvedBy: sanitizeText(input.approvedBy || '', 150),
      memberId: memberId || undefined,
      memberName: memberName || undefined,
      memberNumber: memberNumber || undefined,
      proofUrl: proofRes.value,
      notes: sanitizeText(input.notes || '', 500),
      history: Array.isArray(input.history)
        ? input.history.slice(0, 20).map((h) => ({
            timestamp: sanitizeText(h.timestamp, 50),
            action: sanitizeText(h.action, 120),
            userName: sanitizeText(h.userName, 150),
          }))
        : undefined,
      createdAt: sanitizeText(input.createdAt || nowIso, 50) || nowIso,
      updatedAt: nowIso,
    },
  };
}

export function validateOrgStructureInput(input: Partial<OrgStructureMember>): {
  valid: boolean;
  errors: string[];
  sanitized: OrgStructureMember;
} {
  const errors: string[] = [];
  const role = sanitizeText(input.role, 100);
  const name = sanitizeText(input.name, 150);
  const title = sanitizeText(input.title, 200);
  if (!role) errors.push('Jabatan pengurus wajib diisi.');
  if (!name) errors.push('Nama pengurus wajib diisi.');

  const imageRes = sanitizeUrl(input.image || '', { allowDataImage: true, maxLength: 900000 });
  if (!imageRes.valid) errors.push(`Foto pengurus: ${imageRes.error}`);

  const order = Number.isFinite(Number(input.order)) ? Math.max(0, Math.min(999, Number(input.order))) : 1;

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      id: isValidDocId(input.id) ? input.id : 'org-' + Date.now(),
      role,
      name,
      title,
      image: imageRes.value,
      order,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function validateContactInfoInput(input: Partial<OrgContactInfo>): {
  valid: boolean;
  errors: string[];
  sanitized: OrgContactInfo;
} {
  const errors: string[] = [];
  const officeName = sanitizeText(input.officeName, 150);
  const address = sanitizeText(input.address, 300);
  if (!officeName) errors.push('Nama kantor/sekretariat wajib diisi.');
  if (!address) errors.push('Alamat sekretariat wajib diisi.');

  const emailCheck = validateEmail(input.email, true);
  if (!emailCheck.valid) errors.push(emailCheck.error || 'Email sekretariat tidak valid.');

  const waCheck = validateWhatsAppPhone(input.whatsapp, true);
  if (!waCheck.valid) errors.push(`WhatsApp sekretariat: ${waCheck.error}`);

  const mapsRes = sanitizeUrl(input.googleMapsUrl || '', { allowDataImage: false, maxLength: 500 });
  if (!mapsRes.valid) errors.push(`URL Google Maps: ${mapsRes.error}`);

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      officeName,
      subTitle: sanitizeText(input.subTitle, 150),
      address,
      phone: sanitizeText(input.phone, 30),
      whatsapp: waCheck.cleaned,
      email: emailCheck.cleaned,
      operatingHours: sanitizeText(input.operatingHours, 100),
      googleMapsUrl: mapsRes.value,
      instagram: sanitizeText(input.instagram, 200),
      tiktok: sanitizeText(input.tiktok, 200),
      youtube: sanitizeText(input.youtube, 200),
      facebook: sanitizeText(input.facebook, 200),
      updatedAt: new Date().toISOString(),
    },
  };
}

export function validateVisionMissionInput(input: Partial<OrgVisionMission>): {
  valid: boolean;
  errors: string[];
  sanitized: OrgVisionMission;
} {
  const errors: string[] = [];
  const vision = sanitizeText(input.vision, 1000);
  if (vision.length < 5) errors.push('Visi organisasi minimal 5 karakter.');

  const missions = Array.isArray(input.missions)
    ? input.missions.map((m) => sanitizeText(m, 400)).filter((m) => m.length > 0).slice(0, 20)
    : [];
  if (missions.length === 0) errors.push('Minimal harus ada 1 poin misi organisasi.');

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      vision,
      missions,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function validateUserProfileInput(input: Partial<UserProfile>): {
  valid: boolean;
  errors: string[];
  sanitized: UserProfile;
} {
  const errors: string[] = [];
  const displayName = sanitizeText(input.displayName, 150);
  if (displayName.length < 2) errors.push('Nama pengguna minimal 2 karakter.');

  const emailCheck = validateEmail(input.email, true);
  if (!emailCheck.valid) errors.push(emailCheck.error || 'Email pengguna tidak valid.');

  const role: UserRole = VALID_ROLES.includes(input.role as UserRole)
    ? (input.role as UserRole)
    : 'member';

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      uid: isValidDocId(input.uid) ? input.uid : 'usr-' + Date.now(),
      email: emailCheck.cleaned,
      displayName,
      role,
      kelurahan: sanitizeText(input.kelurahan || 'Kecamatan Tangerang', 100),
      photoURL: sanitizeUrl(input.photoURL || '', { allowDataImage: false, maxLength: 500 }).value || undefined,
      createdAt: sanitizeText(input.createdAt || new Date().toISOString(), 50),
      updatedAt: new Date().toISOString(),
    },
  };
}
