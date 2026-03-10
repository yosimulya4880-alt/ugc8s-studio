import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { useAuth } from './AuthContext';
import WelcomePage from './components/WelcomePage';
import AuthPage from './components/AuthPage';
import StudioApp from './StudioApp';
import { LogOut, ChevronDown, Zap } from 'lucide-react';

type AppView = 'welcome' | 'login' | 'register';

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center mx-auto shadow-xl shadow-primary/30 animate-pulse">
        <Zap className="w-7 h-7 text-white" fill="currentColor" />
      </div>
      <div className="text-gray-500 text-sm font-body">Memuat Nexus Studio...</div>
    </div>
  </div>
);

const UserTopBar: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { userProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const name = userProfile?.username || userProfile?.email?.split('@')[0] || 'User';
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="fixed top-0 right-0 z-[9999] p-3">
      <div className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors hover:bg-white/5"
          style={{ background: 'rgba(24,24,27,0.8)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
            {initial}
          </div>
          <span className="text-sm font-display font-semibold hidden sm:block">{name}</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
        </button>

        {open && (
          <div className="absolute top-full right-0 mt-2 rounded-2xl p-2 min-w-[200px]"
            style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div className="px-3 py-2 mb-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="text-sm font-display font-bold text-white">{name}</div>
              <div className="text-xs text-gray-500 mt-0.5 truncate">{userProfile?.email}</div>
              {userProfile?.phone && <div className="text-xs text-gray-600 mt-0.5">{userProfile.phone}</div>}
              <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}>
                ✦ {userProfile?.plan?.toUpperCase() || 'FREE'}
              </div>
            </div>
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors"
              style={{ color: '#f87171' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { firebaseUser, loading } = useAuth();
  const [view, setView] = useState<AppView>('welcome');

  const handleLogout = async () => {
    await signOut(auth);
    setView('welcome');
  };

  if (loading) return <LoadingScreen />;

  // ─── Authenticated: show Studio ───
  if (firebaseUser) {
    return (
      <div className="relative">
        <UserTopBar onLogout={handleLogout} />
        <StudioApp />
      </div>
    );
  }

  // ─── Not authenticated: welcome / auth ───
  if (view === 'welcome') {
    return <WelcomePage onShowAuth={(tab) => setView(tab)} />;
  }

  return (
    <AuthPage
      initialTab={view === 'register' ? 'register' : 'login'}
      onBack={() => setView('welcome')}
    />
  );
};

export default App;
