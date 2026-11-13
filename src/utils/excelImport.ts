import * as XLSX from 'xlsx';
import { KELURAHAN_LIST, Member, BusinessCategory } from '../types';
import {
  SECURITY_LIMITS,
  sanitizeText,
  sanitizeUrl,
  validateNIK,
  validateEmail,
  validateWhatsAppPhone,
  validateUploadedFile,
} from './validation';

/**
 * Header kolom Excel wajib sesuai struktur form keanggotaan.
 */
export const EXCEL_TEMPLATE_HEADERS = [
  'foto anggota',
  'nama lengkap',
  'NIK',
  'no. whatsapp/HP',
  'email',
  'Kelurahan',
  'alamat domisil KTP',
  'nama usaha/merk',
  'Kategori usaha',
  'produk unggulan',
  'no. kontak whatsapp usaha',
  'alamat usaha/toko',
  'legalitas yg dimiliki',
  'foto produk',
] as const;

/**
 * Placeholder SVG bawaan agar kartu anggota (KTA) dan katalog usaha tetap rapi
 * dan tidak error saat kolom foto pada file Excel dikosongkan.
 */
export const DEFAULT_MEMBER_PHOTO_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="200" height="240">
      <rect width="200" height="240" fill="#f1f5f9"/>
      <circle cx="100" cy="88" r="42" fill="#cbd5e1"/>
      <path d="M32 225 C32 165 168 165 168 225 Z" fill="#94a3b8"/>
    </svg>`
  );

export const DEFAULT_PRODUCT_PHOTO_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f0fdfa"/>
          <stop offset="100%" stop-color="#e2e8f0"/>
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#bg)"/>
      <rect x="145" y="85" width="110" height="90" rx="14" fill="#0d9488" opacity="0.16"/>
      <path d="M168 108 h64 l8 20 h-80 z" fill="#0f766e" opacity="0.75"/>
      <rect x="160" y="128" width="80" height="40" rx="6" fill="#14b8a6" opacity="0.65"/>
      <text x="200" y="212" font-family="sans-serif" font-size="14" font-weight="700" fill="#475569" text-anchor="middle">Produk UMKM KUAT</text>
    </svg>`
  );

const BUSINESS_CATEGORIES: BusinessCategory[] = [
  'Kuliner',
  'Fashion & Tekstil',
  'Kriya & Kerajinan',
  'Jasa & Konsultasi',
  'Perdagangan & Toko',
  'Pertanian & Agro',
  'Kesehatan & Kecantikan',
  'Teknologi & Digital',
  'Lainnya',
];

/**
 * Mengonversi tautan berbagi Google Drive (:://google.com) menjadi tautan gambar langsung (:://googleusercontent.com).
 * Jika URL kosong, mengembalikan placeholder default yang rapi.
 */
export function normalizeMemberImageUrl(raw: string | undefined, kind: 'member' | 'product'): string {
  const placeholder =
    kind === 'member' ? DEFAULT_MEMBER_PHOTO_PLACEHOLDER : DEFAULT_PRODUCT_PHOTO_PLACEHOLDER;

  if (!raw) return placeholder;
  const trimmed = raw.replace(/\0/g, '').trim();
  if (!trimmed || trimmed === '-' || trimmed.toLowerCase() === 'kosong' || trimmed.toLowerCase() === 'n/a') {
    return placeholder;
  }

  // Konversi otomatis link Google Drive / Docs ke direct image googleusercontent.com
  let candidate = trimmed;
  if (!candidate.includes('googleusercontent.com') && !candidate.startsWith('data:image/') && /google\.com/i.test(candidate)) {
    const fileIdMatch =
      candidate.match(/\/d\/([a-zA-Z0-9_-]{10,})/) ||
      candidate.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
    if (fileIdMatch && fileIdMatch[1]) {
      candidate = `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
    }
  }

  // Validasi URL aman (blokir skema berbahaya seperti javascript:, data:text/html, vbscript:)
  const urlCheck = sanitizeUrl(candidate, { allowDataImage: true, maxLength: 900000 });
  if (!urlCheck.valid || !urlCheck.value) {
    return placeholder;
  }

  return urlCheck.value;
}

/**
 * Membaca nilai sel SheetJS sebagai String/Teks secara akurat:
 * - Mencegah NIK 16 digit berubah ke notasi eksponensial (3.67E+15)
 * - Menjaga angka 0 di depan nomor WhatsApp / HP
 */
function extractCellAsText(
  cell: XLSX.CellObject | undefined,
  mode: 'text' | 'nik' | 'phone'
): string {
  if (!cell || cell.v === undefined || cell.v === null) return '';

  // Jika sudah tersimpan sebagai teks di Excel
  if (cell.t === 's' || typeof cell.v === 'string') {
    let val = String(cell.v).trim().replace(/^'+/, '');
    if (mode === 'nik') {
      // Tangani jika terlanjur tersimpan sebagai string eksponensial
      if (/^\d+(\.\d+)?[eE]\+?\d+$/.test(val)) {
        const num = Number(val);
        if (Number.isFinite(num)) {
          val = Math.trunc(num).toFixed(0);
        }
      }
      return val.replace(/\D/g, '');
    }
    if (mode === 'phone') {
      return val.replace(/\s+/g, '');
    }
    return val;
  }

  // Jika tersimpan sebagai angka (numeric) di Excel
  if (cell.t === 'n' && typeof cell.v === 'number') {
    if (mode === 'nik') {
      // Konversi angka integer penuh tanpa notasi eksponensial
      return Math.round(cell.v).toFixed(0);
    }

    if (mode === 'phone') {
      // Cek apakah format tampilan Excel (cell.w) menyimpan nol di depan dan bukan eksponensial
      if (cell.w && !/[eE]/.test(cell.w)) {
        const formatted = cell.w.trim().replace(/[^0-9+]/g, '');
        if (/^0\d{7,}$/.test(formatted) || /^\+?62\d{7,}$/.test(formatted)) {
          return formatted;
        }
      }
      const rawDigits = Math.round(cell.v).toFixed(0);
      // Jika angka 0 di depan terpotong Excel (misal 81234567890), pulihkan menjadi 081234567890
      if (/^8\d{7,13}$/.test(rawDigits)) {
        return '0' + rawDigits;
      }
      return rawDigits;
    }

    return Number.isInteger(cell.v) ? cell.v.toFixed(0) : String(cell.v).trim();
  }

  return String(cell.w ?? cell.v).trim();
}

function normalizeKelurahan(raw: string): { value: string; matched: boolean } {
  const cleaned = raw.trim();
  if (!cleaned) return { value: 'Babakan', matched: false };

  const normalized = cleaned.toLowerCase().replace(/^kel\.?\s*/i, '').replace(/^kelurahan\s+/i, '').trim();
  const compact = normalized.replace(/\s+/g, '');

  for (const kel of KELURAHAN_LIST) {
    if (kel.toLowerCase() === normalized || kel.toLowerCase().replace(/\s+/g, '') === compact) {
      return { value: kel, matched: true };
    }
  }
  return { value: cleaned, matched: false };
}

function normalizeCategory(raw: string): string {
  const cleaned = raw.trim();
  if (!cleaned) return 'Kuliner';
  const lower = cleaned.toLowerCase();

  const exact = BUSINESS_CATEGORIES.find((c) => c.toLowerCase() === lower);
  if (exact) return exact;

  if (lower.includes('kuliner') || lower.includes('makanan') || lower.includes('minuman')) return 'Kuliner';
  if (lower.includes('fashion') || lower.includes('baju') || lower.includes('tekstil') || lower.includes('busana')) return 'Fashion & Tekstil';
  if (lower.includes('kriya') || lower.includes('kerajinan') || lower.includes('craft')) return 'Kriya & Kerajinan';
  if (lower.includes('jasa') || lower.includes('konsultasi') || lower.includes('layanan')) return 'Jasa & Konsultasi';
  if (lower.includes('dagang') || lower.includes('toko') || lower.includes('warung') || lower.includes('retail')) return 'Perdagangan & Toko';
  if (lower.includes('tani') || lower.includes('agro') || lower.includes('kebun')) return 'Pertanian & Agro';
  if (lower.includes('sehat') || lower.includes('cantik') || lower.includes('herbal') || lower.includes('kosmetik')) return 'Kesehatan & Kecantikan';
  if (lower.includes('tekno') || lower.includes('digital') || lower.includes('it')) return 'Teknologi & Digital';

  return cleaned.slice(0, 80);
}

export interface ParsedExcelMemberRow {
  rowNumber: number; // Nomor baris pada Excel (mulai baris 2)
  data: Omit<Member, 'id' | 'memberNumber' | 'createdAt' | 'updatedAt'>;
  rawMemberPhoto: string;
  rawProductPhoto: string;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

export interface ExcelParseResult {
  rows: ParsedExcelMemberRow[];
  validCount: number;
  invalidCount: number;
  missingHeaders: string[];
}

function normalizeHeaderKey(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, ' ');
}

const HEADER_TO_FIELD_MAP: Record<
  string,
  { field: keyof ParsedExcelMemberRow['data']; mode: 'text' | 'nik' | 'phone' }
> = {
  'foto anggota': { field: 'memberPhoto', mode: 'text' },
  'nama lengkap': { field: 'fullName', mode: 'text' },
  'nik': { field: 'nik', mode: 'nik' },
  'no. whatsapp/hp': { field: 'phone', mode: 'phone' },
  'no whatsapp/hp': { field: 'phone', mode: 'phone' },
  'email': { field: 'email', mode: 'text' },
  'kelurahan': { field: 'kelurahan', mode: 'text' },
  'alamat domisil ktp': { field: 'address', mode: 'text' },
  'alamat domisili ktp': { field: 'address', mode: 'text' },
  'nama usaha/merk': { field: 'businessName', mode: 'text' },
  'kategori usaha': { field: 'category', mode: 'text' },
  'produk unggulan': { field: 'topProduct', mode: 'text' },
  'no. kontak whatsapp usaha': { field: 'businessPhone', mode: 'phone' },
  'no kontak whatsapp usaha': { field: 'businessPhone', mode: 'phone' },
  'alamat usaha/toko': { field: 'businessAddress', mode: 'text' },
  'legalitas yg dimiliki': { field: 'legalities', mode: 'text' },
  'legalitas yang dimiliki': { field: 'legalities', mode: 'text' },
  'foto produk': { field: 'productPhoto', mode: 'text' },
};

/**
 * Mengunduh file template Excel kosong (.xlsx) dengan header kolom persis sesuai struktur form.
 */
export function downloadExcelTemplate(): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([[...EXCEL_TEMPLATE_HEADERS]]);

  // Atur lebar kolom agar mudah dibaca
  ws['!cols'] = [
    { wch: 28 }, // foto anggota
    { wch: 26 }, // nama lengkap
    { wch: 20 }, // NIK
    { wch: 18 }, // no. whatsapp/HP
    { wch: 24 }, // email
    { wch: 16 }, // Kelurahan
    { wch: 32 }, // alamat domisil KTP
    { wch: 26 }, // nama usaha/merk
    { wch: 22 }, // Kategori usaha
    { wch: 26 }, // produk unggulan
    { wch: 24 }, // no. kontak whatsapp usaha
    { wch: 32 }, // alamat usaha/toko
    { wch: 26 }, // legalitas yg dimiliki
    { wch: 28 }, // foto produk
  ];

  // Siapkan format teks ('@') untuk kolom NIK & WhatsApp di baris 2..200 agar angka 0 dan 16 digit NIK aman
  const textColIndices = [2, 3, 10]; // NIK, no. whatsapp/HP, no. kontak whatsapp usaha
  for (let r = 1; r <= 200; r++) {
    for (const c of textColIndices) {
      const addr = XLSX.utils.encode_cell({ r, c });
      ws[addr] = { t: 's', v: '', z: '@' };
    }
  }
  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: 200, c: EXCEL_TEMPLATE_HEADERS.length - 1 },
  });

  XLSX.utils.book_append_sheet(wb, ws, 'Data Anggota UMKM');
  XLSX.writeFile(wb, 'Template_Import_Anggota_UMKM_KUAT.xlsx');
}

/**
 * Membaca file Excel (.xlsx, .xls, .csv) dari browser dan memvalidasi terhadap anggota yang sudah ada.
 */
export async function parseExcelMembersFile(
  file: File,
  existingMembers: Member[]
): Promise<ExcelParseResult> {
  const fileCheck = validateUploadedFile(file, 'excel');
  if (!fileCheck.valid) {
    throw new Error(fileCheck.error || 'File spreadsheet tidak valid.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', raw: true });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('File Excel tidak memiliki lembar kerja (sheet) yang dapat dibaca.');
  }

  const ws = workbook.Sheets[firstSheetName];
  if (!ws || !ws['!ref']) {
    throw new Error('Lembar kerja Excel kosong.');
  }

  const range = XLSX.utils.decode_range(ws['!ref']);

  // 1. Baca baris header (baris pertama yang tidak kosong)
  const colMapping: Array<{
    colIdx: number;
    field: keyof ParsedExcelMemberRow['data'];
    mode: 'text' | 'nik' | 'phone';
  }> = [];

  const foundHeaders = new Set<string>();
  const headerRowIdx = range.s.r;

  for (let c = range.s.c; c <= range.e.c; c++) {
    const cellAddr = XLSX.utils.encode_cell({ r: headerRowIdx, c });
    const cellText = extractCellAsText(ws[cellAddr], 'text');
    const norm = normalizeHeaderKey(cellText);
    if (!norm) continue;
    foundHeaders.add(norm);
    const mapped = HEADER_TO_FIELD_MAP[norm];
    if (mapped) {
      colMapping.push({ colIdx: c, ...mapped });
    }
  }

  // Cek header wajib minimal
  const missingHeaders = EXCEL_TEMPLATE_HEADERS.filter((reqHeader) => {
    const normReq = normalizeHeaderKey(reqHeader);
    if (foundHeaders.has(normReq)) return false;
    // Cek alias ejaan kecil
    if (normReq === 'alamat domisil ktp' && foundHeaders.has('alamat domisili ktp')) return false;
    if (normReq === 'legalitas yg dimiliki' && foundHeaders.has('legalitas yang dimiliki')) return false;
    if (normReq === 'no. whatsapp/hp' && foundHeaders.has('no whatsapp/hp')) return false;
    if (normReq === 'no. kontak whatsapp usaha' && foundHeaders.has('no kontak whatsapp usaha')) return false;
    return true;
  });

  // Siapkan set NIK existing untuk deteksi duplikasi cepat
  const existingNikSet = new Set(
    existingMembers.map((m) => (m.nik || '').trim()).filter((n) => n !== '')
  );
  const seenNiksInFile = new Map<string, number>();

  const rows: ParsedExcelMemberRow[] = [];
  const todayStr = new Date().toISOString().split('T')[0];

  // 2. Iterasi baris data mulai baris setelah header
  for (let r = headerRowIdx + 1; r <= range.e.r; r++) {
    const rawValues: Record<string, string> = {};
    let hasAnyValue = false;

    for (const mapItem of colMapping) {
      const addr = XLSX.utils.encode_cell({ r, c: mapItem.colIdx });
      const val = extractCellAsText(ws[addr], mapItem.mode);
      rawValues[mapItem.field] = val;
      if (val !== '') {
        hasAnyValue = true;
      }
    }

    // Lewati baris yang benar-benar kosong
    if (!hasAnyValue) continue;

    const errors: string[] = [];
    const warnings: string[] = [];

    const fullName = sanitizeText(rawValues.fullName, 150);
    const nikCheck = validateNIK(rawValues.nik);
    const nik = nikCheck.cleaned;
    const phoneCheck = validateWhatsAppPhone(rawValues.phone, true);
    const phone = phoneCheck.cleaned;
    const emailCheck = validateEmail(rawValues.email, false);
    const email = emailCheck.cleaned;
    const kelResult = normalizeKelurahan(sanitizeText(rawValues.kelurahan, 100));
    const address = sanitizeText(rawValues.address, 300);
    const businessName = sanitizeText(rawValues.businessName, 150);
    const category = normalizeCategory(sanitizeText(rawValues.category, 80));
    const topProduct = sanitizeText(rawValues.topProduct, 150);
    const bizPhoneRaw = sanitizeText(rawValues.businessPhone, 30) || phone;
    const bizPhoneCheck = validateWhatsAppPhone(bizPhoneRaw, true);
    const businessPhone = bizPhoneCheck.cleaned || phone;
    const businessAddress = sanitizeText(rawValues.businessAddress, 300) || address;
    const legalities = sanitizeText(rawValues.legalities, 300);

    const rawMemberPhoto = (rawValues.memberPhoto || '').replace(/\0/g, '').trim();
    const rawProductPhoto = (rawValues.productPhoto || '').replace(/\0/g, '').trim();
    const memberPhoto = normalizeMemberImageUrl(rawMemberPhoto, 'member');
    const productPhoto = normalizeMemberImageUrl(rawProductPhoto, 'product');

    // Validasi kolom wajib & keamanan format
    if (!fullName || fullName.length < 2) {
      errors.push('Nama lengkap wajib diisi (minimal 2 karakter)');
    }

    if (!nikCheck.valid) {
      errors.push(nikCheck.error || 'NIK wajib tepat 16 digit angka');
    } else {
      if (existingNikSet.has(nik)) {
        errors.push(`NIK ${nik} sudah terdaftar di database`);
      } else if (seenNiksInFile.has(nik)) {
        errors.push(`NIK ${nik} duplikat dengan baris ${seenNiksInFile.get(nik)}`);
      } else {
        seenNiksInFile.set(nik, r + 1);
      }
    }

    if (!phoneCheck.valid) {
      errors.push(phoneCheck.error || 'No. WhatsApp/HP tidak valid (9-15 digit)');
    }

    if (!emailCheck.valid) {
      errors.push(emailCheck.error || 'Format email tidak valid');
    }

    if (!bizPhoneCheck.valid && rawValues.businessPhone?.trim()) {
      errors.push(`No. kontak usaha: ${bizPhoneCheck.error}`);
    }

    if (!businessName || businessName.length < 2) {
      errors.push('Nama usaha/merk wajib diisi (minimal 2 karakter)');
    }

    if (!kelResult.matched && rawValues.kelurahan?.trim()) {
      warnings.push(`Kelurahan "${sanitizeText(rawValues.kelurahan, 60)}" di luar daftar baku`);
    } else if (!rawValues.kelurahan?.trim()) {
      warnings.push('Kelurahan kosong (default: Babakan)');
    }

    if (!topProduct) {
      warnings.push('Produk unggulan kosong');
    }

    if (rows.length >= SECURITY_LIMITS.MAX_BULK_IMPORT_ROWS) {
      throw new Error(
        `Maksimal ${SECURITY_LIMITS.MAX_BULK_IMPORT_ROWS} baris data per sekali import Excel untuk menjaga stabilitas & kuota layanan cloud.`
      );
    }

    rows.push({
      rowNumber: r + 1,
      data: {
        fullName,
        nik,
        phone,
        email,
        kelurahan: sanitizeText(kelResult.value, 100),
        address: address || '-',
        status: 'aktif',
        joinDate: todayStr,
        businessName,
        category,
        topProduct: topProduct || businessName || '-',
        businessPhone,
        businessAddress: businessAddress || '-',
        legalities,
        memberPhoto,
        productPhoto,
        isPublicDirectory: true,
      },
      rawMemberPhoto,
      rawProductPhoto,
      errors,
      warnings,
      isValid: errors.length === 0,
    });
  }

  const validCount = rows.filter((r) => r.isValid).length;
  const invalidCount = rows.length - validCount;

  return {
    rows,
    validCount,
    invalidCount,
    missingHeaders,
  };
}
