import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { UserRole } from '../../../src/types';
import { SECURITY_LIMITS } from '../../../src/utils/validation';

interface FirebaseAppletConfig {
  projectId: string;
  apiKey: string;
  firestoreDatabaseId: string;
}

let cachedFirebaseConfig: FirebaseAppletConfig | null = null;

export function getFirebaseServerConfig(): FirebaseAppletConfig {
  if (cachedFirebaseConfig) return cachedFirebaseConfig;

  let fileConfig: Partial<FirebaseAppletConfig> = {};
  const candidates = [
    path.resolve(process.cwd(), 'firebase-applet-config.json'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        fileConfig = JSON.parse(fs.readFileSync(p, 'utf8'));
        break;
      }
    } catch {
      // ignore and continue
    }
  }

  cachedFirebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID || fileConfig.projectId || '',
    apiKey: process.env.FIREBASE_API_KEY || fileConfig.apiKey || '',
    firestoreDatabaseId:
      process.env.FIREBASE_DATABASE_ID || fileConfig.firestoreDatabaseId || '(default)',
  };
  return cachedFirebaseConfig;
}

/**
 * Daftar email Super Admin resmi disimpan hanya di server (env SUPER_ADMIN_EMAILS atau default organisasi).
 */
export function getServerSuperAdminEmails(): string[] {
  const fromEnv = (process.env.SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (fromEnv.length > 0) return fromEnv;

  return [
    'agus.cabin@gmail.com',
    'umkmkectangerang@gmail.com',
    'ketua.umkm@tangerangkota.go.id',
    'keanggotaan@umkmkuat-tangerang.org',
    'sekretaris@umkmkuat-tangerang.org',
    'bendahara@umkmkuat-tangerang.org',
  ];
}

// =====================================================================
// RATE LIMITER & CLOUD COST / QUOTA GUARDRAILS
// =====================================================================
interface RateBucket {
  count: number;
  resetAt: number;
}

const rateBuckets = new Map<string, RateBucket>();
const publicRegBuckets = new Map<string, RateBucket>();
const dailyCloudUsage = new Map<string, number>();

function cleanupExpiredBuckets(map: Map<string, RateBucket>, now: number) {
  if (map.size < 2000) return;
  for (const [key, bucket] of map.entries()) {
    if (bucket.resetAt <= now) {
      map.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetEpochSec: number;
  retryAfterSec: number;
  reason?: string;
}

export function checkRateLimit(
  clientKey: string,
  options?: { maxPerMinute?: number; isPublicRegistration?: boolean }
): RateLimitResult {
  const now = Date.now();
  cleanupExpiredBuckets(rateBuckets, now);
  cleanupExpiredBuckets(publicRegBuckets, now);

  const envLimit = Number(process.env.RATE_LIMIT_MAX_PER_MIN || '');
  const limit =
    options?.maxPerMinute ||
    (Number.isFinite(envLimit) && envLimit > 0
      ? envLimit
      : SECURITY_LIMITS.RATE_LIMIT_MAX_REQUESTS_PER_MIN);

  const windowMs = 60_000;
  let bucket = rateBuckets.get(clientKey);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
  }
  bucket.count += 1;
  rateBuckets.set(clientKey, bucket);

  const remaining = Math.max(0, limit - bucket.count);
  const resetEpochSec = Math.ceil(bucket.resetAt / 1000);
  const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  if (bucket.count > limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetEpochSec,
      retryAfterSec,
      reason: `Terlalu banyak permintaan. Maksimal ${limit} permintaan per menit per IP/pengguna.`,
    };
  }

  // Batas khusus pendaftaran publik: maksimal 10 pendaftaran per 15 menit per IP
  if (options?.isPublicRegistration) {
    const regWindowMs = 15 * 60_000;
    const regLimit = 10;
    const regKey = `reg:${clientKey}`;
    let regBucket = publicRegBuckets.get(regKey);
    if (!regBucket || regBucket.resetAt <= now) {
      regBucket = { count: 0, resetAt: now + regWindowMs };
    }
    regBucket.count += 1;
    publicRegBuckets.set(regKey, regBucket);

    if (regBucket.count > regLimit) {
      return {
        allowed: false,
        limit: regLimit,
        remaining: 0,
        resetEpochSec: Math.ceil(regBucket.resetAt / 1000),
        retryAfterSec: Math.max(1, Math.ceil((regBucket.resetAt - now) / 1000)),
        reason: 'Batas pengiriman pendaftaran sementara tercapai. Silakan coba lagi beberapa menit lagi.',
      };
    }
  }

  return {
    allowed: true,
    limit,
    remaining,
    resetEpochSec,
    retryAfterSec,
  };
}

/**
 * Pengaman Batas Biaya Cloud (Cloud Cost & Daily Write Quota Guard):
 * Mencegah lonjakan penulisan database / pemanggilan API berlebih dalam sehari.
 */
export function checkAndConsumeCloudQuota(costUnits = 1): {
  allowed: boolean;
  usedToday: number;
  dailyLimit: number;
  reason?: string;
} {
  const dailyLimitEnv = Number(process.env.CLOUD_DAILY_WRITE_LIMIT || '');
  const dailyLimit =
    Number.isFinite(dailyLimitEnv) && dailyLimitEnv > 0 ? dailyLimitEnv : 2500;

  const dayKey = new Date().toISOString().slice(0, 10);
  const current = dailyCloudUsage.get(dayKey) || 0;

  if (current + costUnits > dailyLimit) {
    return {
      allowed: false,
      usedToday: current,
      dailyLimit,
      reason: `Batas kuota harian operasional cloud (${dailyLimit} unit/hari) telah tercapai untuk mencegah pembengkakan biaya.`,
    };
  }

  dailyCloudUsage.set(dayKey, current + costUnits);
  return {
    allowed: true,
    usedToday: current + costUnits,
    dailyLimit,
  };
}

// =====================================================================
// GOOGLE JWKS RS256 FIREBASE ID TOKEN VERIFICATION
// =====================================================================
const GOOGLE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let cachedCerts: Record<string, string> = {};
let certsExpireAt = 0;

async function getGooglePublicCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (certsExpireAt > now && Object.keys(cachedCerts).length > 0) {
    return cachedCerts;
  }

  const res = await fetch(GOOGLE_CERTS_URL);
  if (!res.ok) {
    throw new Error('Gagal mengambil sertifikat verifikasi Google Firebase Auth.');
  }

  const cacheControl = res.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeMs = maxAgeMatch ? Number(maxAgeMatch[1]) * 1000 : 3600_000;

  cachedCerts = (await res.json()) as Record<string, string>;
  certsExpireAt = now + maxAgeMs;
  return cachedCerts;
}

function base64UrlDecode(segment: string): Buffer {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(normalized + '='.repeat(padLen), 'base64');
}

export interface VerifiedFirebaseUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  picture?: string;
  idToken: string;
}

export async function verifyFirebaseIdToken(authHeader: string | undefined): Promise<VerifiedFirebaseUser> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('UNAUTHENTICATED: Token otentikasi tidak ditemukan.');
  }

  const idToken = authHeader.slice(7).trim();
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('UNAUTHENTICATED: Format token JWT tidak valid.');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = JSON.parse(base64UrlDecode(encodedHeader).toString('utf8'));
  const payload = JSON.parse(base64UrlDecode(encodedPayload).toString('utf8'));

  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('UNAUTHENTICATED: Algoritma atau Key ID token tidak valid.');
  }

  const certs = await getGooglePublicCerts();
  const certPem = certs[header.kid];
  if (!certPem) {
    throw new Error('UNAUTHENTICATED: Sertifikat kunci token tidak dikenali.');
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${encodedHeader}.${encodedPayload}`);
  verifier.end();

  const signatureValid = verifier.verify(certPem, base64UrlDecode(encodedSignature));
  if (!signatureValid) {
    throw new Error('UNAUTHENTICATED: Tanda tangan digital token tidak sah.');
  }

  const { projectId } = getFirebaseServerConfig();
  const nowSec = Math.floor(Date.now() / 1000);

  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new Error('UNAUTHENTICATED: Subjek pengguna token kosong.');
  }
  if (projectId && payload.aud !== projectId) {
    throw new Error('UNAUTHENTICATED: Audience token tidak cocok dengan proyek ini.');
  }
  if (projectId && payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error('UNAUTHENTICATED: Issuer token tidak valid.');
  }
  if (typeof payload.exp !== 'number' || payload.exp <= nowSec) {
    throw new Error('UNAUTHENTICATED: Sesi login telah kedaluwarsa. Silakan login ulang.');
  }
  if (typeof payload.iat !== 'number' || payload.iat > nowSec + 300) {
    throw new Error('UNAUTHENTICATED: Waktu penerbitan token tidak valid.');
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const emailVerified = payload.email_verified === true;
  if (!email || !emailVerified) {
    throw new Error('FORBIDDEN: Email akun Google belum terverifikasi.');
  }

  return {
    uid: payload.sub,
    email,
    emailVerified,
    displayName: typeof payload.name === 'string' ? payload.name : email,
    picture: typeof payload.picture === 'string' ? payload.picture : undefined,
    idToken,
  };
}

// =====================================================================
// FIRESTORE REST API HELPERS (MENGGUNAKAN TOKEN PENGGUNA TERVERIFIKASI)
// =====================================================================
export function toFirestoreValue(val: unknown): Record<string, unknown> {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map((v) => toFirestoreValue(v)) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, Record<string, unknown>> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

export function fromFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return null;
  if ('nullValue' in val) return null;
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('stringValue' in val) return String(val.stringValue);
  if ('timestampValue' in val) return String(val.timestampValue);
  if ('arrayValue' in val) {
    return Array.isArray(val.arrayValue?.values)
      ? val.arrayValue.values.map((v: any) => fromFirestoreValue(v))
      : [];
  }
  if ('mapValue' in val) {
    const obj: Record<string, any> = {};
    const fields = val.mapValue?.fields || {};
    for (const [k, v] of Object.entries(fields)) {
      obj[k] = fromFirestoreValue(v);
    }
    return obj;
  }
  return null;
}

export function toFirestoreDocumentFields(obj: Record<string, unknown>): Record<string, Record<string, unknown>> {
  const fields: Record<string, Record<string, unknown>> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      fields[k] = toFirestoreValue(v);
    }
  }
  return fields;
}

export function fromFirestoreDocument(docJson: any): Record<string, any> | null {
  if (!docJson || !docJson.fields) return null;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(docJson.fields)) {
    out[k] = fromFirestoreValue(v);
  }
  if (docJson.name && !out.id) {
    const segs = String(docJson.name).split('/');
    out.id = segs[segs.length - 1];
  }
  return out;
}

function getFirestoreBaseUrl(): string {
  const { projectId, firestoreDatabaseId } = getFirebaseServerConfig();
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents`;
}

export async function firestoreGetDoc(
  docPath: string,
  idToken?: string
): Promise<Record<string, any> | null> {
  const { apiKey } = getFirebaseServerConfig();
  const url = `${getFirestoreBaseUrl()}/${docPath}?key=${encodeURIComponent(apiKey)}`;
  const headers: Record<string, string> = {};
  if (idToken) headers.Authorization = `Bearer ${idToken}`;

  const res = await fetch(url, { headers });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Firestore GET ${docPath} gagal (${res.status}): ${text}`);
  }
  const json = await res.json();
  return fromFirestoreDocument(json);
}

export async function firestoreSetDoc(
  docPath: string,
  data: Record<string, unknown>,
  idToken?: string
): Promise<void> {
  const { apiKey } = getFirebaseServerConfig();
  const url = `${getFirestoreBaseUrl()}/${docPath}?key=${encodeURIComponent(apiKey)}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (idToken) headers.Authorization = `Bearer ${idToken}`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ fields: toFirestoreDocumentFields(data) }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Firestore WRITE ${docPath} ditolak (${res.status}): ${text}`);
  }
}

export async function firestoreDeleteDoc(docPath: string, idToken: string): Promise<void> {
  const { apiKey } = getFirebaseServerConfig();
  const url = `${getFirestoreBaseUrl()}/${docPath}?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => '');
    throw new Error(`Firestore DELETE ${docPath} ditolak (${res.status}): ${text}`);
  }
}

export async function firestoreRunQuery(
  collectionId: string,
  fieldPath: string,
  value: string | boolean,
  idToken?: string
): Promise<Record<string, any>[]> {
  const { projectId, firestoreDatabaseId, apiKey } = getFirebaseServerConfig();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents:runQuery?key=${encodeURIComponent(apiKey)}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (idToken) headers.Authorization = `Bearer ${idToken}`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId }],
        where: {
          fieldFilter: {
            field: { fieldPath },
            op: 'EQUAL',
            value: toFirestoreValue(value),
          },
        },
        limit: 5,
      },
    }),
  });

  if (!res.ok) {
    return [];
  }
  const rows = (await res.json()) as any[];
  return rows
    .map((r) => (r.document ? fromFirestoreDocument(r.document) : null))
    .filter((d): d is Record<string, any> => d !== null);
}

// =====================================================================
// AUTHORITATIVE BACKEND RBAC RESOLUTION
// =====================================================================
const VALID_STAFF_ROLES: UserRole[] = [
  'super_admin',
  'pengurus_kecamatan',
  'admin_keanggotaan',
  'bendahara',
  'admin_informasi',
  'pengurus_kelurahan',
];

export async function resolveAuthoritativeRole(user: VerifiedFirebaseUser): Promise<UserRole> {
  // 1. Cek daftar email Super Admin resmi di sisi server
  if (getServerSuperAdminEmails().includes(user.email)) {
    return 'super_admin';
  }

  // 2. Cek dokumen /admin_emails/{email} di Firestore
  try {
    const emailDoc = await firestoreGetDoc(`admin_emails/${user.email.toLowerCase()}`, user.idToken);
    if (emailDoc && typeof emailDoc.role === 'string' && VALID_STAFF_ROLES.includes(emailDoc.role as UserRole)) {
      return emailDoc.role as UserRole;
    }
  } catch {
    // lanjut cek users/{uid}
  }

  // 3. Cek dokumen /users/{uid} di Firestore
  try {
    const userDoc = await firestoreGetDoc(`users/${user.uid}`, user.idToken);
    if (userDoc && typeof userDoc.role === 'string' && VALID_STAFF_ROLES.includes(userDoc.role as UserRole)) {
      return userDoc.role as UserRole;
    }
  } catch {
    // default member
  }

  // 4. Default ketat: user umum hanya mendapatkan peran 'member'
  return 'member';
}

export function checkActionPermission(role: UserRole, action: string): boolean {
  if (role === 'member') return false;
  if (role === 'super_admin') return true;

  switch (action) {
    case 'member:save':
    case 'member:delete':
    case 'member:bulk_import':
      return ['pengurus_kecamatan', 'admin_keanggotaan', 'pengurus_kelurahan'].includes(role);
    case 'event:save':
    case 'event:delete':
    case 'article:save':
    case 'article:delete':
      return ['pengurus_kecamatan', 'admin_informasi'].includes(role);
    case 'transaction:save':
    case 'transaction:delete':
      return role === 'bendahara';
    case 'org_structure:save':
    case 'org_structure:delete':
    case 'settings:save_contact':
    case 'settings:save_vision_mission':
    case 'user:save':
    case 'user:delete':
    case 'system:clear_all':
    case 'system:import_backup':
      return false; // Khusus Super Admin
    default:
      return false;
  }
}
