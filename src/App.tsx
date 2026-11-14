import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { dbService } from './services/db';
import { Member, Transaction, ForumEvent, Article, ActivityLog } from './types';
import { Navbar } from './components/public/Navbar';
import { Footer } from './components/public/Footer';
import { HomePage } from './pages/public/HomePage';
import { ProfilePage } from './pages/public/ProfilePage';
import { DirectoryPage } from './pages/public/DirectoryPage';
import { EventsPage } from './pages/public/EventsPage';
import { NewsPage } from './pages/public/NewsPage';
import { ContactPage } from './pages/public/ContactPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { LoginModal } from './components/auth/LoginModal';
import { AdminSidebar } from './components/admin/AdminSidebar';
import { AdminNavbar } from './components/admin/AdminNavbar';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminMembers } from './pages/admin/AdminMembers';
import { AdminFinances } from './pages/admin/AdminFinances';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminEventsNews } from './pages/admin/AdminEventsNews';
import { AdminSettings } from './pages/admin/AdminSettings';
import { ShieldAlert, LogIn, Store, X } from 'lucide-react';
import { AdminGuardSkeleton } from './components/common/Skeleton';

function MainApp() {
  const { profile, isAdmin, loading: authLoading, logout } = useAuth();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>('beranda');
  const [adminMenu, setAdminMenu] = useState<string>('dashboard');
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Selected item modals in public view
  const [selectedEvent, setSelectedEvent] = useState<ForumEvent | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Data Store (empty default, real members synced from Firestore/cache)
  const [members, setMembers] = useState<Member[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('umkm_mgmt_members');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        // ignore
      }
    }
    return [];
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<ForumEvent[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Quick Action flags from dashboard
  const [openAddMember, setOpenAddMember] = useState(false);
  const [openAddTx, setOpenAddTx] = useState(false);
  const [openAddEvt, setOpenAddEvt] = useState(false);

  const loadAllData = async () => {
    try {
      const [m, t, e, a, l] = await Promise.all([
        dbService.getMembers(isAdmin),
        isAdmin ? dbService.getTransactions() : Promise.resolve([]),
        dbService.getEvents(),
        dbService.getArticles(),
        isAdmin ? dbService.getLogs() : Promise.resolve([]),
      ]);
      setMembers(m || []);
      setTransactions(t);
      setEvents(e);
      setArticles(a);
      setLogs(l);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    loadAllData();

    // Realtime Firestore synchronization: public users query directory only, admins receive full list
    const unsubscribeMembers = dbService.subscribeMembers((realtimeMembers) => {
      setMembers(realtimeMembers);
    }, isAdmin);

    const unsubscribeEvents = dbService.subscribeEvents((realtimeEvents) => {
      setEvents(realtimeEvents);
    });

    const unsubscribeArticles = dbService.subscribeArticles((realtimeArticles) => {
      setArticles(realtimeArticles);
    });

    // Listen for cross-component updates in same window
    const handleMembersUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setMembers(e.detail);
      }
    };
    const handleEventsUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setEvents(e.detail);
      }
    };
    const handleArticlesUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setArticles(e.detail);
      }
    };

    window.addEventListener('umkm_members_updated', handleMembersUpdated);
    window.addEventListener('umkm_events_updated', handleEventsUpdated);
    window.addEventListener('umkm_articles_updated', handleArticlesUpdated);

    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('tab') === 'daftar') {
        setCurrentTab('daftar');
      }
    } catch (e) {
      // ignore
    }

    return () => {
      unsubscribeMembers();
      unsubscribeEvents();
      unsubscribeArticles();
      window.removeEventListener('umkm_members_updated', handleMembersUpdated);
      window.removeEventListener('umkm_events_updated', handleEventsUpdated);
      window.removeEventListener('umkm_articles_updated', handleArticlesUpdated);
    };
  }, [isAdmin, authLoading]);

  // Jika user baru kembali dari fallback Google redirect login dan terverifikasi admin, langsung buka dashboard
  useEffect(() => {
    if (!authLoading && isAdmin && sessionStorage.getItem('umkm_pending_admin_redirect') === '1') {
      sessionStorage.removeItem('umkm_pending_admin_redirect');
      setCurrentTab('admin');
      setAdminMenu('dashboard');
    }
  }, [authLoading, isAdmin]);

  // Public View Render
  if (currentTab !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col bg-[#F7F6F2] text-stone-900 font-sans selection:bg-teal-700 selection:text-white">
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          openLoginModal={() => setLoginModalOpen(true)}
        />

        <main className="flex-1">
          {currentTab === 'beranda' && (
            <HomePage
              members={members}
              events={events}
              articles={articles}
              isLoading={loadingData || authLoading}
              setCurrentTab={setCurrentTab}
              setSelectedEvent={setSelectedEvent}
              setSelectedArticle={setSelectedArticle}
            />
          )}

          {currentTab === 'profil' && <ProfilePage />}

          {currentTab === 'direktori' && (
            <DirectoryPage members={members} isLoading={loadingData || authLoading} />
          )}

          {currentTab === 'event' && (
            <EventsPage
              events={events}
              isLoading={loadingData || authLoading}
              selectedEvent={selectedEvent}
              setSelectedEvent={setSelectedEvent}
            />
          )}

          {currentTab === 'berita' && (
            <NewsPage
              articles={articles}
              isLoading={loadingData || authLoading}
              selectedArticle={selectedArticle}
              setSelectedArticle={setSelectedArticle}
            />
          )}

          {currentTab === 'daftar' && (
            <RegisterPage
              members={members}
              onRegistrationSuccess={loadAllData}
              setCurrentTab={setCurrentTab}
            />
          )}

          {currentTab === 'kontak' && <ContactPage />}
        </main>

        <Footer
          setCurrentTab={setCurrentTab}
          openLoginModal={() => setLoginModalOpen(true)}
        />

        <LoginModal
          isOpen={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
          onSuccess={() => {
            setCurrentTab('admin');
            setAdminMenu('dashboard');
          }}
        />
      </div>
    );
  }

  // Dashboard Admin Guard
  if (authLoading) {
    return <AdminGuardSkeleton />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#121918] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center space-y-6 border border-stone-200">
          <div className="h-14 w-14 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">Akses Terbatas</h2>
            <p className="text-xs text-stone-600 leading-relaxed">
              Dashboard Admin hanya dapat diakses oleh pengguna terautentikasi dan berwenang Forum UMKM KUAT Kecamatan Tangerang.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => setLoginModalOpen(true)}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk Sebagai Pengurus / Admin</span>
            </button>
            <button
              onClick={() => setCurrentTab('beranda')}
              className="w-full text-xs text-stone-500 hover:text-stone-900 font-semibold py-2 cursor-pointer"
            >
              Kembali ke Website Publik
            </button>
          </div>
        </div>

        <LoginModal
          isOpen={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
          onSuccess={() => {
            setCurrentTab('admin');
            setAdminMenu('dashboard');
          }}
        />
      </div>
    );
  }

  // System Security Rule 4: STRICT ISOLATION - 403 Forbidden for 'member' role
  if (profile.role === 'member') {
    return (
      <div className="min-h-screen bg-[#121918] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full text-center space-y-6 border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
          <div className="h-14 w-14 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-50 text-red-700 text-xs font-mono font-bold uppercase tracking-wider border border-red-200">
              Error 403 Forbidden &bull; Akses Ditolak
            </div>
            <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Hak Akses Administratif Dibatasi
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Akun Anda (<strong className="text-stone-900">{profile.email}</strong>) terautentikasi dengan peran <strong className="text-stone-900">Member / Pendaftar</strong>. Sesuai prinsip <em>Least Privilege & Strict Isolation</em>, akun pendaftar tidak diizinkan masuk ke panel administrasi internal Forum UMKM KUAT.
            </p>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-left space-y-2 text-xs text-stone-700">
            <span className="font-bold text-stone-500 block text-[11px] uppercase tracking-wider">
              Hak Akses Anda (Least Privilege):
            </span>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-700"></span>
              <span>Mengisi dan memperbarui formulir profil usaha mandiri</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-700"></span>
              <span>Mengunggah dokumen legalitas & bukti pendaftaran Anda sendiri</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-700"></span>
              <span>Mencetak Kartu Tanda Anggota (KTA) digital Anda</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={async () => {
                await logout();
                setLoginModalOpen(true);
              }}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white py-3 rounded-xl font-bold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-teal-400" />
              <span>Ganti Akun Pengurus (Login Ulang)</span>
            </button>
            <button
              onClick={() => setCurrentTab('daftar')}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-xl font-bold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              <span>Buka Formulir Pendaftaran / KTA Saya</span>
            </button>
            <button
              onClick={() => setCurrentTab('beranda')}
              className="w-full text-xs text-stone-500 hover:text-stone-900 font-semibold py-2 cursor-pointer"
            >
              Kembali ke Halaman Beranda Publik
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Admin Dashboard Layout
  return (
    <div className="min-h-screen flex bg-[#F7F6F2] text-stone-900 font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar
          activeMenu={adminMenu}
          setActiveMenu={setAdminMenu}
          onExitToPublic={() => setCurrentTab('beranda')}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-50 flex lg:hidden bg-stone-950/65 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-72 max-w-[85vw] h-full border-r border-stone-800 animate-in slide-in-from-left duration-200"
          >
            <AdminSidebar
              activeMenu={adminMenu}
              setActiveMenu={(m) => {
                setAdminMenu(m);
                setMobileSidebarOpen(false);
              }}
              onExitToPublic={() => {
                setCurrentTab('beranda');
                setMobileSidebarOpen(false);
              }}
            />
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-3 p-1.5 text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-lg border border-stone-700 cursor-pointer z-20 transition-colors"
              aria-label="Tutup Menu Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Admin Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminNavbar
          activeMenu={adminMenu}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onExitToPublic={() => setCurrentTab('beranda')}
        />

        <main className="flex-1 overflow-y-auto">
          {adminMenu === 'dashboard' && (
            <AdminDashboard
              members={members}
              transactions={transactions}
              events={events}
              articles={articles}
              logs={logs}
              setActiveMenu={setAdminMenu}
              onOpenAddMember={() => {
                setAdminMenu('keanggotaan');
                setOpenAddMember(true);
              }}
              onOpenAddTransaction={() => {
                setAdminMenu('keuangan');
                setOpenAddTx(true);
              }}
              onOpenAddEvent={() => {
                setAdminMenu('event_berita');
                setOpenAddEvt(true);
              }}
            />
          )}

          {adminMenu === 'keanggotaan' && (
            <AdminMembers
              members={members}
              onRefresh={loadAllData}
              openAddModalInitially={openAddMember}
            />
          )}

          {adminMenu === 'keuangan' && (
            <AdminFinances
              transactions={transactions}
              members={members}
              onRefresh={loadAllData}
              openAddModalInitially={openAddTx}
            />
          )}

          {adminMenu === 'laporan' && (
            <AdminReports
              members={members}
              transactions={transactions}
              events={events}
            />
          )}

          {adminMenu === 'event_berita' && (
            <AdminEventsNews
              events={events}
              articles={articles}
              onRefresh={loadAllData}
              openAddEventInitially={openAddEvt}
            />
          )}

          {adminMenu === 'pengaturan' && (
            <AdminSettings logs={logs} onRefreshAll={loadAllData} />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
