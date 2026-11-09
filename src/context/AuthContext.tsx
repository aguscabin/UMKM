import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isMember: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  simulateRole: (role: UserRole) => void;
  quickAdminLogin: (role?: UserRole) => void;
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
const DEMO_USER_KEY = 'umkm_demo_active';

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
  const [loading, setLoading] = useState(true);

  // Determine user profile and role strictly based on registered emails
  const resolveProfile = (fbUser: FirebaseUser | null, forcedRole?: UserRole): UserProfile | null => {
    if (!fbUser) return null;
    
    const emailLower = (fbUser.email || '').trim().toLowerCase();
    
    // Check registered super admin emails (ketua sampai bendahara)
    const isRegisteredSuperAdmin = REGISTERED_SUPER_ADMIN_EMAILS.includes(emailLower);

    // Also check registered users in local storage / database
    let registeredDbRole: UserRole | null = null;
    try {
      const rawUsers = localStorage.getItem('umkm_mgmt_users');
      if (rawUsers) {
        const usersList: UserProfile[] = JSON.parse(rawUsers);
        const match = usersList.find((u) => u.email?.trim().toLowerCase() === emailLower);
        if (match) {
          registeredDbRole = match.role;
        }
      }
    } catch (e) {
      // ignore
    }

    // Default: strictly 'member' for any unregistered user
    let role: UserRole = 'member';

    if (isRegisteredSuperAdmin) {
      role = 'super_admin';
    } else if (registeredDbRole && registeredDbRole !== 'member') {
      role = registeredDbRole;
    } else {
      // Non-registered email only receives member access
      role = 'member';
      localStorage.removeItem(ROLE_STORAGE_KEY);
    }

    // Allow role simulation ONLY if user is already a verified super admin
    const savedRole = (localStorage.getItem(ROLE_STORAGE_KEY) as UserRole) || forcedRole;
    if ((isRegisteredSuperAdmin || registeredDbRole === 'super_admin') && savedRole) {
      role = savedRole;
    }

    return {
      uid: fbUser.uid,
      email: fbUser.email || 'user@umkmkuat-tangerang.org',
      displayName: fbUser.displayName || (role === 'member' ? 'Anggota UMKM' : 'Pengurus Forum'),
      role,
      photoURL: fbUser.photoURL || undefined,
      kelurahan: role === 'member' ? 'Kecamatan Tangerang' : 'Kecamatan Tangerang (Semua)',
    };
  };

  useEffect(() => {
    // Check if demo admin mode is active
    const isDemo = localStorage.getItem(DEMO_USER_KEY) === 'true';
    if (isDemo) {
      const demoRole = (localStorage.getItem(ROLE_STORAGE_KEY) as UserRole) || 'super_admin';
      const mockUser = {
        uid: 'usr-agus-superadmin',
        email: 'agus.cabin@gmail.com',
        displayName: 'Agus Cabin (Super Admin)',
      } as unknown as FirebaseUser;
      
      setUser(mockUser);
      setProfile({
        uid: mockUser.uid,
        email: mockUser.email || '',
        displayName: mockUser.displayName || '',
        role: demoRole,
        kelurahan: 'Kecamatan Tangerang',
      });
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        setProfile(resolveProfile(fbUser));
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      localStorage.removeItem(DEMO_USER_KEY);
      const res = await signInWithPopup(auth, googleProvider);
      setUser(res.user);
      setProfile(resolveProfile(res.user));
    } catch (err: unknown) {
      console.error('Google Sign-in failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem(DEMO_USER_KEY);
    localStorage.removeItem(ROLE_STORAGE_KEY);
    setUser(null);
    setProfile(null);
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Signout error:', e);
    }
  };

  const simulateRole = (role: UserRole) => {
    // Only verified super admin can simulate roles
    const currentEmail = (profile?.email || '').trim().toLowerCase();
    const canSimulate = profile?.role === 'super_admin' || REGISTERED_SUPER_ADMIN_EMAILS.includes(currentEmail);
    if (canSimulate) {
      localStorage.setItem(ROLE_STORAGE_KEY, role);
      if (profile) {
        setProfile({ ...profile, role });
      }
    }
  };

  const quickAdminLogin = (role: UserRole = 'super_admin') => {
    localStorage.setItem(DEMO_USER_KEY, 'true');
    localStorage.setItem(ROLE_STORAGE_KEY, role);
    const mockUser = {
      uid: 'usr-agus-superadmin',
      email: 'agus.cabin@gmail.com',
      displayName: 'Agus Cabin (Super Admin)',
    } as unknown as FirebaseUser;
    
    setUser(mockUser);
    setProfile({
      uid: mockUser.uid,
      email: mockUser.email || '',
      displayName: mockUser.displayName || '',
      role,
      kelurahan: 'Kecamatan Tangerang',
    });
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
        logout,
        simulateRole,
        quickAdminLogin,
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
