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

function MainApp() {
  const { profile, loading: authLoading } = useAuth();

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
        dbService.getMembers(),
        dbService.getTransactions(),
        dbService.getEvents(),
        dbService.getArticles(),
        dbService.getLogs(),
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
    loadAllData();

    // Realtime Firestore synchronization: instant sync across HP/mobile and desktop
    const unsubscribeMembers = dbService.subscribeMembers((realtimeMembers) => {
      setMembers(realtimeMembers);
    });

    // Listen for cross-component member updates in same window
    const handleMembersUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setMembers(e.detail);
      }
    };

    window.addEventListener('umkm_members_updated', handleMembersUpdated);

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
      window.removeEventListener('umkm_members_updated', handleMembersUpdated);
    };
  }, []);

  // Public View Render
  if (currentTab !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-teal-500 selection:text-white">
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
              setCurrentTab={setCurrentTab}
              setSelectedEvent={setSelectedEvent}
              setSelectedArticle={setSelectedArticle}
            />
          )}

          {currentTab === 'profil' && <ProfilePage />}

          {currentTab === 'direktori' && <DirectoryPage members={members} />}

          {currentTab === 'event' && (
            <EventsPage
              events={events}
              selectedEvent={selectedEvent}
              setSelectedEvent={setSelectedEvent}
            />
          )}

          {currentTab === 'berita' && (
            <NewsPage
              articles={articles}
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
  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="h-16 w-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Akses Terbatas</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dashboard Admin hanya dapat diakses oleh pengguna terautentikasi dan berwenang Forum UMKM KUAT Kecamatan Tangerang.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => setLoginModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk Sebagai Pengurus / Admin</span>
            </button>
            <button
              onClick={() => setCurrentTab('beranda')}
              className="w-full text-xs text-slate-500 hover:text-slate-800 font-semibold py-2"
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-lg w-full text-center space-y-6 shadow-2xl border border-red-100 animate-in fade-in zoom-in-95 duration-200">
          <div className="h-16 w-16 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-9 h-9" />
          </div>
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100/80 text-red-700 text-xs font-mono font-bold uppercase tracking-wider border border-red-300">
              Error 403 Forbidden &bull; Akses Ditolak
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Hak Akses Administratif Dibatasi
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Akun Anda terautentikasi dengan peran <strong className="text-slate-900">Member / Pendaftar</strong>. Sesuai prinsip <em>Least Privilege & Strict Isolation</em>, akun pendaftar tidak diizinkan masuk ke panel administrasi internal Forum UMKM KUAT.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2 text-xs text-slate-700">
            <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider text-slate-400">
              Hak Akses Anda (Least Privilege):
            </span>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500"></span>
              <span>Mengisi dan memperbarui formulir profil usaha mandiri</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500"></span>
              <span>Mengunggah dokumen legalitas & bukti pendaftaran Anda sendiri</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500"></span>
              <span>Mencetak Kartu Tanda Anggota (KTA) digital Anda</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => setCurrentTab('daftar')}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-colors cursor-pointer"
            >
              <span>Buka Formulir Pendaftaran / KTA Saya</span>
            </button>
            <button
              onClick={() => setCurrentTab('beranda')}
              className="w-full text-xs text-slate-500 hover:text-slate-800 font-semibold py-2 cursor-pointer"
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
    <div className="min-h-screen flex bg-slate-100 text-slate-800 font-sans">
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
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/80 backdrop-blur-xs">
          <div className="relative w-72 max-w-full">
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
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 -right-12 p-2 text-white bg-slate-800 rounded-lg"
              aria-label="Close Sidebar"
            >
              <X className="w-6 h-6" />
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
