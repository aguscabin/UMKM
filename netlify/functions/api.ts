import {
  SECURITY_LIMITS,
  isValidDocId,
  sanitizeText,
  validateArticleInput,
  validateContactInfoInput,
  validateEventInput,
  validateMemberInput,
  validateOrgStructureInput,
  validateTransactionInput,
  validateUserProfileInput,
  validateVisionMissionInput,
} from '../../src/utils/validation';
import {
  checkActionPermission,
  checkAndConsumeCloudQuota,
  checkRateLimit,
  firestoreDeleteDoc,
  firestoreRunQuery,
  firestoreSetDoc,
  resolveAuthoritativeRole,
  verifyFirebaseIdToken,
} from './_shared/security';

export interface UnifiedApiRequest {
  method: string;
  pathname: string;
  clientIp: string;
  headers: Record<string, string | undefined>;
  rawBody: string;
}

export interface UnifiedApiResponse {
  status: number;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

function buildHeaders(rateInfo?: {
  limit: number;
  remaining: number;
  resetEpochSec: number;
  retryAfterSec?: number;
}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
  };
  if (rateInfo) {
    headers['X-RateLimit-Limit'] = String(rateInfo.limit);
    headers['X-RateLimit-Remaining'] = String(rateInfo.remaining);
    headers['X-RateLimit-Reset'] = String(rateInfo.resetEpochSec);
    if (rateInfo.retryAfterSec) {
      headers['Retry-After'] = String(rateInfo.retryAfterSec);
    }
  }
  return headers;
}

export async function handleSecurityApiRequest(
  req: UnifiedApiRequest
): Promise<UnifiedApiResponse> {
  const method = (req.method || 'GET').toUpperCase();
  const normalizedPath = req.pathname
    .replace(/^\/\.netlify\/functions\/api/, '')
    .replace(/^\/api/, '') || '/';

  if (method === 'OPTIONS') {
    return {
      status: 204,
      headers: buildHeaders(),
      body: { ok: true },
    };
  }

  // Batas ukuran payload (mencegah serangan Denial-of-Wallet / payload bloat)
  if (Buffer.byteLength(req.rawBody || '', 'utf8') > SECURITY_LIMITS.MAX_JSON_BODY_BYTES) {
    return {
      status: 413,
      headers: buildHeaders(),
      body: {
        error: 'Ukuran payload melebihi batas maksimal 1 MB.',
        code: 'PAYLOAD_TOO_LARGE',
      },
    };
  }

  const isPublicReg = method === 'POST' && normalizedPath === '/members/register';
  const rate = checkRateLimit(req.clientIp || 'unknown', { isPublicRegistration: isPublicReg });
  const rateHeaders = buildHeaders(rate);

  if (!rate.allowed) {
    return {
      status: 429,
      headers: rateHeaders,
      body: {
        error: rate.reason || 'Terlalu banyak permintaan. Coba beberapa saat lagi.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
    };
  }

  // 1. Health / security status check (tidak pernah mengekspos kunci rahasia)
  if (method === 'GET' && (normalizedPath === '/health' || normalizedPath === '/')) {
    return {
      status: 200,
      headers: rateHeaders,
      body: {
        ok: true,
        service: 'umkm-kuat-security-api',
        rateLimitPerMinute: rate.limit,
        serverSecretsConfigured: {
          geminiApiKey: Boolean(process.env.GEMINI_API_KEY),
        },
      },
    };
  }

  let body: Record<string, any> = {};
  if (req.rawBody && req.rawBody.trim() !== '') {
    try {
      body = JSON.parse(req.rawBody);
    } catch {
      return {
        status: 400,
        headers: rateHeaders,
        body: { error: 'Format JSON tidak valid.', code: 'INVALID_JSON' },
      };
    }
  }

  // 2. Verifikasi sesi & otorisasi peran (RBAC) di sisi server
  if (method === 'POST' && normalizedPath === '/auth/verify') {
    try {
      const verifiedUser = await verifyFirebaseIdToken(req.headers.authorization);
      const role = await resolveAuthoritativeRole(verifiedUser);

      return {
        status: 200,
        headers: rateHeaders,
        body: {
          ok: true,
          uid: verifiedUser.uid,
          email: verifiedUser.email,
          displayName: sanitizeText(verifiedUser.displayName, 150),
          photoURL: verifiedUser.picture,
          role,
          isAdmin: role !== 'member',
          isSuperAdmin: role === 'super_admin',
        },
      };
    } catch (err: any) {
      const msg = String(err?.message || 'Unauthorized');
      const status = msg.startsWith('FORBIDDEN') ? 403 : 401;
      return {
        status,
        headers: rateHeaders,
        body: { error: msg.replace(/^(UNAUTHENTICATED|FORBIDDEN):\s*/, ''), code: 'AUTH_FAILED' },
      };
    }
  }

  // 3. Pendaftaran anggota UMKM publik dengan validasi ketat, XSS sanitization, rate limiter & kuota cloud
  if (method === 'POST' && normalizedPath === '/members/register') {
    const quota = checkAndConsumeCloudQuota(2);
    if (!quota.allowed) {
      return {
        status: 429,
        headers: rateHeaders,
        body: { error: quota.reason, code: 'CLOUD_QUOTA_EXCEEDED' },
      };
    }

    const validation = validateMemberInput(
      {
        ...body,
        status: 'aktif',
      },
      { requireValidNik: true }
    );

    if (!validation.valid) {
      return {
        status: 400,
        headers: rateHeaders,
        body: {
          error: validation.errors[0] || 'Data pendaftaran tidak valid.',
          errors: validation.errors,
          code: 'VALIDATION_ERROR',
        },
      };
    }

    const member = validation.sanitized;
    try {
      // Cek duplikasi NIK di database jika query publik tersedia
      const dupNik = await firestoreRunQuery('members', 'nik', member.nik);
      if (dupNik.length > 0) {
        return {
          status: 409,
          headers: rateHeaders,
          body: {
            error: `NIK ${member.nik} sudah terdaftar dalam sistem.`,
            code: 'DUPLICATE_NIK',
          },
        };
      }

      await firestoreSetDoc(`members/${member.id}`, member as unknown as Record<string, unknown>);
      const logId = `log-${Date.now()}`;
      await firestoreSetDoc(`activity_logs/${logId}`, {
        id: logId,
        userId: 'publik-online',
        userName: member.fullName,
        action: 'Pendaftaran Online Mandiri',
        target: member.memberNumber,
        details: `Pendaftaran UMKM mandiri (Kel. ${member.kelurahan})`,
        timestamp: new Date().toISOString(),
      }).catch(() => {});

      return {
        status: 201,
        headers: rateHeaders,
        body: { ok: true, member },
      };
    } catch (err: any) {
      return {
        status: 502,
        headers: rateHeaders,
        body: {
          error: err?.message || 'Gagal menyimpan pendaftaran ke database.',
          code: 'PERSISTENCE_ERROR',
        },
      };
    }
  }

  // 4. Gateway Mutasi Admin Terproteksi (Wajib Token Valid + Role Admin + Validasi Input + Batas Biaya Cloud)
  if (method === 'POST' && normalizedPath === '/admin/action') {
    let verifiedUser;
    try {
      verifiedUser = await verifyFirebaseIdToken(req.headers.authorization);
    } catch (err: any) {
      const msg = String(err?.message || 'Unauthorized');
      return {
        status: 401,
        headers: rateHeaders,
        body: {
          error: msg.replace(/^(UNAUTHENTICATED|FORBIDDEN):\s*/, ''),
          code: 'UNAUTHENTICATED',
        },
      };
    }

    // Rate limit per UID terautentikasi juga
    const userRate = checkRateLimit(`uid:${verifiedUser.uid}`);
    if (!userRate.allowed) {
      return {
        status: 429,
        headers: buildHeaders(userRate),
        body: { error: userRate.reason, code: 'USER_RATE_LIMIT_EXCEEDED' },
      };
    }

    const role = await resolveAuthoritativeRole(verifiedUser);
    const action = sanitizeText(body.action, 60);
    const payload = body.payload ?? {};

    if (!action) {
      return {
        status: 400,
        headers: rateHeaders,
        body: { error: 'Aksi admin wajib disertakan.', code: 'MISSING_ACTION' },
      };
    }

    if (action !== 'log:add' && !checkActionPermission(role, action)) {
      return {
        status: 403,
        headers: rateHeaders,
        body: {
          error: `Akses ditolak (403 Forbidden): Peran "${role}" tidak memiliki izin untuk aksi "${action}".`,
          code: 'FORBIDDEN',
        },
      };
    }

    // Cek kuota biaya cloud
    const costUnits =
      action === 'member:bulk_import' && Array.isArray(payload.members)
        ? Math.min(payload.members.length, SECURITY_LIMITS.MAX_BULK_IMPORT_ROWS)
        : 1;
    const quota = checkAndConsumeCloudQuota(costUnits);
    if (!quota.allowed) {
      return {
        status: 429,
        headers: rateHeaders,
        body: { error: quota.reason, code: 'CLOUD_QUOTA_EXCEEDED' },
      };
    }

    try {
      switch (action) {
        case 'member:save': {
          const check = validateMemberInput(payload, { requireValidNik: true });
          if (!check.valid) {
            return {
              status: 400,
              headers: rateHeaders,
              body: { error: check.errors[0], errors: check.errors, code: 'VALIDATION_ERROR' },
            };
          }
          await firestoreSetDoc(
            `members/${check.sanitized.id}`,
            check.sanitized as unknown as Record<string, unknown>,
            verifiedUser.idToken
          );
          return { status: 200, headers: rateHeaders, body: { ok: true, data: check.sanitized } };
        }

        case 'member:delete': {
          const id = payload.id;
          if (!isValidDocId(id)) {
            return { status: 400, headers: rateHeaders, body: { error: 'ID anggota tidak valid.' } };
          }
          await firestoreDeleteDoc(`members/${id}`, verifiedUser.idToken);
          return { status: 200, headers: rateHeaders, body: { ok: true } };
        }

        case 'member:bulk_import': {
          const rawMembers = Array.isArray(payload.members) ? payload.members : [];
          if (rawMembers.length === 0) {
            return { status: 400, headers: rateHeaders, body: { error: 'Daftar anggota kosong.' } };
          }
          if (rawMembers.length > SECURITY_LIMITS.MAX_BULK_IMPORT_ROWS) {
            return {
              status: 400,
              headers: rateHeaders,
              body: {
                error: `Maksimal ${SECURITY_LIMITS.MAX_BULK_IMPORT_ROWS} data per proses import Excel.`,
              },
            };
          }
          const sanitizedList = [];
          for (let i = 0; i < rawMembers.length; i++) {
            const check = validateMemberInput(rawMembers[i], { requireValidNik: true });
            if (!check.valid) {
              return {
                status: 400,
                headers: rateHeaders,
                body: {
                  error: `Baris #${i + 1} gagal validasi backend: ${check.errors[0]}`,
                  errors: check.errors,
                },
              };
            }
            sanitizedList.push(check.sanitized);
          }
          for (const item of sanitizedList) {
            await firestoreSetDoc(
              `members/${item.id}`,
              item as unknown as Record<string, unknown>,
              verifiedUser.idToken
            );
          }
          return {
            status: 200,
            headers: rateHeaders,
            body: { ok: true, count: sanitizedList.length, data: sanitizedList },
          };
        }

        case 'event:save': {
          const check = validateEventInput(payload);
          if (!check.valid) {
            return {
              status: 400,
              headers: rateHeaders,
              body: { error: check.errors[0], errors: check.errors },
            };
          }
          await firestoreSetDoc(
            `events/${check.sanitized.id}`,
            check.sanitized as unknown as Record<string, unknown>,
            verifiedUser.idToken
          );
          return { status: 200, headers: rateHeaders, body: { ok: true, data: check.sanitized } };
        }

        case 'event:delete': {
          if (!isValidDocId(payload.id)) {
            return { status: 400, headers: rateHeaders, body: { error: 'ID agenda tidak valid.' } };
          }
          await firestoreDeleteDoc(`events/${payload.id}`, verifiedUser.idToken);
          return { status: 200, headers: rateHeaders, body: { ok: true } };
        }

        case 'article:save': {
          const check = validateArticleInput(payload);
          if (!check.valid) {
            return {
              status: 400,
              headers: rateHeaders,
              body: { error: check.errors[0], errors: check.errors },
            };
          }
          await firestoreSetDoc(
            `articles/${check.sanitized.id}`,
            check.sanitized as unknown as Record<string, unknown>,
            verifiedUser.idToken
          );
          return { status: 200, headers: rateHeaders, body: { ok: true, data: check.sanitized } };
        }

        case 'article:delete': {
          if (!isValidDocId(payload.id)) {
            return { status: 400, headers: rateHeaders, body: { error: 'ID berita tidak valid.' } };
          }
          await firestoreDeleteDoc(`articles/${payload.id}`, verifiedUser.idToken);
          return { status: 200, headers: rateHeaders, body: { ok: true } };
        }

        case 'transaction:save': {
          const check = validateTransactionInput(payload);
          if (!check.valid) {
            return {
              status: 400,
              headers: rateHeaders,
              body: { error: check.errors[0], errors: check.errors },
            };
          }
          await firestoreSetDoc(
            `transactions/${check.sanitized.id}`,
            check.sanitized as unknown as Record<string, unknown>,
            verifiedUser.idToken
          );
          return { status: 200, headers: rateHeaders, body: { ok: true, data: check.sanitized } };
        }

        case 'transaction:delete': {
          if (!isValidDocId(payload.id)) {
            return { status: 400, headers: rateHeaders, body: { error: 'ID transaksi tidak valid.' } };
          }
          await firestoreDeleteDoc(`transactions/${payload.id}`, verifiedUser.idToken);
          return { status: 200, headers: rateHeaders, body: { ok: true } };
        }

        case 'org_structure:save': {
          const check = validateOrgStructureInput(payload);
          if (!check.valid) {
            return {
              status: 400,
              headers: rateHeaders,
              body: { error: check.errors[0], errors: check.errors },
            };
          }
          await firestoreSetDoc(
            `org_structure/${check.sanitized.id}`,
            check.sanitized as unknown as Record<string, unknown>,
            verifiedUser.idToken
          );
          return { status: 200, headers: rateHeaders, body: { ok: true, data: check.sanitized } };
        }

        case 'org_structure:delete': {
          if (!isValidDocId(payload.id)) {
            return { status: 400, headers: rateHeaders, body: { error: 'ID pengurus tidak valid.' } };
          }
          await firestoreDeleteDoc(`org_structure/${payload.id}`, verifiedUser.idToken);
          return { status: 200, headers: rateHeaders, body: { ok: true } };
        }

        case 'settings:save_contact': {
          const check = validateContactInfoInput(payload);
          if (!check.valid) {
            return {
              status: 400,
              headers: rateHeaders,
              body: { error: check.errors[0], errors: check.errors },
            };
          }
          await firestoreSetDoc(
            'org_settings/contact_info',
            check.sanitized as unknown as Record<string, unknown>,
            verifiedUser.idToken
          );
          return { status: 200, headers: rateHeaders, body: { ok: true, data: check.sanitized } };
        }

        case 'settings:save_vision_mission': {
          const check = validateVisionMissionInput(payload);
          if (!check.valid) {
            return {
              status: 400,
              headers: rateHeaders,
              body: { error: check.errors[0], errors: check.errors },
            };
          }
          await firestoreSetDoc(
            'org_settings/vision_mission',
            check.sanitized as unknown as Record<string, unknown>,
            verifiedUser.idToken
          );
          return { status: 200, headers: rateHeaders, body: { ok: true, data: check.sanitized } };
        }

        case 'user:save': {
          const check = validateUserProfileInput(payload);
          if (!check.valid) {
            return {
              status: 400,
              headers: rateHeaders,
              body: { error: check.errors[0], errors: check.errors },
            };
          }
          await firestoreSetDoc(
            `users/${check.sanitized.uid}`,
            check.sanitized as unknown as Record<string, unknown>,
            verifiedUser.idToken
          );
          await firestoreSetDoc(
            `admin_emails/${check.sanitized.email.toLowerCase()}`,
            {
              email: check.sanitized.email.toLowerCase(),
              role: check.sanitized.role,
              uid: check.sanitized.uid,
              updatedAt: check.sanitized.updatedAt,
            },
            verifiedUser.idToken
          );
          return { status: 200, headers: rateHeaders, body: { ok: true, data: check.sanitized } };
        }

        case 'user:delete': {
          if (!isValidDocId(payload.uid)) {
            return { status: 400, headers: rateHeaders, body: { error: 'UID pengguna tidak valid.' } };
          }
          await firestoreDeleteDoc(`users/${payload.uid}`, verifiedUser.idToken);
          if (typeof payload.email === 'string' && payload.email.includes('@')) {
            await firestoreDeleteDoc(
              `admin_emails/${payload.email.trim().toLowerCase()}`,
              verifiedUser.idToken
            ).catch(() => {});
          }
          return { status: 200, headers: rateHeaders, body: { ok: true } };
        }

        case 'log:add': {
          if (role === 'member') {
            return { status: 403, headers: rateHeaders, body: { error: 'Forbidden' } };
          }
          const logId = `log-${Date.now()}`;
          const logEntry = {
            id: logId,
            userId: verifiedUser.uid,
            userName: sanitizeText(payload.userName || verifiedUser.displayName, 150),
            action: sanitizeText(payload.action, 100),
            target: sanitizeText(payload.target, 200),
            details: sanitizeText(payload.details, 500),
            timestamp: new Date().toISOString(),
          };
          await firestoreSetDoc(`activity_logs/${logId}`, logEntry, verifiedUser.idToken);
          return { status: 200, headers: rateHeaders, body: { ok: true, data: logEntry } };
        }

        default:
          return {
            status: 400,
            headers: rateHeaders,
            body: { error: `Aksi "${action}" tidak dikenal.` },
          };
      }
    } catch (err: any) {
      return {
        status: 500,
        headers: rateHeaders,
        body: { error: err?.message || 'Kesalahan server saat memproses permintaan.' },
      };
    }
  }

  return {
    status: 404,
    headers: rateHeaders,
    body: { error: 'Endpoint API tidak ditemukan.' },
  };
}

/**
 * Netlify Functions v2 HTTP Handler (/.netlify/functions/api)
 */
export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const rawBody =
    req.method !== 'GET' && req.method !== 'HEAD' ? await req.text().catch(() => '') : '';
  const clientIp =
    req.headers.get('x-nf-client-connection-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';

  const result = await handleSecurityApiRequest({
    method: req.method,
    pathname: url.pathname,
    clientIp,
    headers: {
      authorization: req.headers.get('authorization') || undefined,
    },
    rawBody,
  });

  if (result.status === 204) {
    return new Response(null, { status: 204, headers: result.headers });
  }
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: result.headers,
  });
}
