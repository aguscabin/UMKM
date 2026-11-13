import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isMember: boolean;
  loginWithGoogle: () => Promise<UserProfile>;
  loginWithGoogleRedirect: () => Promise<void>;
  logout: () => Promise<void>;
  simulateRole: (role: UserRole) => void;
  // Permissions
  canManageMembers: boolean;
  canManageFinances: boolean;
  canManageEventsNews: boolean;
  canManageSettings: boolean;
  canAssignRoles: boolean;
  canViewReports: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_STORAGE_KEY = 'umkm_active_role';

const VALID_STAFF_ROLES: UserRole[] = [
  'super_admin',
  'pengurus_kecamatan',
  'admin_keanggotaan',
  'bendahara',
  'admin_informasi',
  'pengurus_kelurahan',
];

export const REGISTERED_SUPER_ADMIN_EMAILS = [
  'agus.cabin@gmail.com',
  'umkmkectangerang@gmail.com',
  'ketua.umkm@tangerangkota.go.id',
  'keanggotaan@umkmkuat-tangerang.org',
  'sekretaris@umkmkuat-tangerang.org',
  'bendahara@umkmkuat-tangerang.org',
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [verifiedBaseRole, setVerifiedBaseRole] = useState<UserRole>('member');
  const [loading, setLoading] = useState(true);

  /**
   * Verifikasi token & hak akses RBAC langsung melalui backend (/api/auth/verify).
   * Fallback baca Firestore terproteksi hanya jika backend sementara tidak terjangkau.
   */
  const resolveAuthoritativeProfile = async (fbUser: FirebaseUser): Promise<UserProfile> => {
    const rawEmail = fbUser.email || fbUser.providerData?.[0]?.email || '';
    const emailLower = rawEmail.trim().toLowerCase();
    let authoritativeRole: UserRole = 'member';

    try {
      const idToken = await fbUser.getIdToken();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      let res: Response;
      try {
        res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (res.ok) {
        const data = await res.json();
        if (
          typeof data?.role === 'string' &&
          (VALID_STAFF_ROLES.includes(data.role as UserRole) || data.role === 'member')
        ) {
          authoritativeRole = data.role as UserRole;
        }
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch {
      // Fallback baca langsung dokumen terproteksi Firestore untuk user terautentikasi
      if (fbUser.emailVerified && REGISTERED_SUPER_ADMIN_EMAILS.includes(emailLower)) {
        authoritativeRole = 'super_admin';
      } else if (fbUser.emailVerified && emailLower) {
        try {
          const emailSnap = await getDoc(doc(db, 'admin_emails', emailLower));
          if (emailSnap.exists()) {
            const r = emailSnap.data()?.role;
            if (VALID_STAFF_ROLES.includes(r)) {
              authoritativeRole = r as UserRole;
            }
          } else {
            const userSnap = await getDoc(doc(db, 'users', fbUser.uid));
            if (userSnap.exists()) {
              const r = userSnap.data()?.role;
              if (VALID_STAFF_ROLES.includes(r)) {
                authoritativeRole = r as UserRole;
              }
            }
          }
        } catch {
          authoritativeRole = 'member';
        }
      }
    }

    setVerifiedBaseRole(authoritativeRole);

    // Simulasi UI hanya boleh aktif jika peran otoritatif terverifikasi adalah 'super_admin'
    let effectiveRole: UserRole = authoritativeRole;
    if (authoritativeRole === 'super_admin') {
      const savedSimRole = sessionStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;
      if (savedSimRole && (VALID_STAFF_ROLES.includes(savedSimRole) || savedSimRole === 'member')) {
        effectiveRole = savedSimRole;
      }
    } else {
      sessionStorage.removeItem(ROLE_STORAGE_KEY);
    }

    return {
      uid: fbUser.uid,
      email: rawEmail,
      displayName: fbUser.displayName || (effectiveRole === 'member' ? 'Anggota UMKM' : 'Pengurus Forum'),
      role: effectiveRole,
      photoURL: fbUser.photoURL || undefined,
      kelurahan: effectiveRole === 'member' ? 'Kecamatan Tangerang' : 'Kecamatan Tangerang (Semua)',
    };
  };

  useEffect(() => {
    let active = true;

    // Tangani hasil redirect jika fallback redirect digunakan
    getRedirectResult(auth).catch((err) => {
      console.warn('Redirect auth result notice:', err);
    });

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!active) return;
      setUser(fbUser);
      if (fbUser) {
        const resolved = await resolveAuthoritativeProfile(fbUser);
        if (active) setProfile(resolved);
      } else {
        setVerifiedBaseRole('member');
        setProfile(null);
        sessionStorage.removeItem(ROLE_STORAGE_KEY);
      }
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = async (): Promise<UserProfile> => {
    setLoading(true);
    sessionStorage.removeItem(ROLE_STORAGE_KEY);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      setUser(res.user);
      const resolved = await resolveAuthoritativeProfile(res.user);
      setProfile(resolved);
      return resolved;
    } catch (err: unknown) {
      console.error('Google Sign-in failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogleRedirect = async (): Promise<void> => {
    sessionStorage.removeItem(ROLE_STORAGE_KEY);
    await signInWithRedirect(auth, googleProvider);
  };

  const logout = async () => {
    sessionStorage.removeItem(ROLE_STORAGE_KEY);
    setVerifiedBaseRole('member');
    setUser(null);
    setProfile(null);
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Signout error:', e);
    }
  };

  const simulateRole = (role: UserRole) => {
    // Hanya Super Admin terverifikasi di backend yang dapat mengubah pratinjau peran UI
    if (verifiedBaseRole === 'super_admin') {
      sessionStorage.setItem(ROLE_STORAGE_KEY, role);
      if (profile) {
        setProfile({ ...profile, role });
      }
    }
  };

  // RBAC Permission gates (System Security Rule 4: Strict Isolation for 'member')
  const currentRole = profile?.role;
  const isSuperAdmin = currentRole === 'super_admin';
  const isMember = currentRole === 'member';
  const isAdmin = Boolean(profile && currentRole !== 'member');

  // System Security Rule 3: Least Privilege Principle
  const canManageMembers = ['super_admin', 'pengurus_kecamatan', 'admin_keanggotaan', 'pengurus_kelurahan'].includes(currentRole || '');
  const canManageFinances = ['super_admin', 'bendahara'].includes(currentRole || '');
  const canManageEventsNews = ['super_admin', 'pengurus_kecamatan', 'admin_informasi'].includes(currentRole || '');

  // System Security Rule 1: Super Admin Control
  const canManageSettings = isSuperAdmin;
  const canAssignRoles = isSuperAdmin;
  const canViewReports = isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        isSuperAdmin,
        isMember,
        loginWithGoogle,
        loginWithGoogleRedirect,
        logout,
        simulateRole,
        canManageMembers,
        canManageFinances,
        canManageEventsNews,
        canManageSettings,
        canAssignRoles,
        canViewReports,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
