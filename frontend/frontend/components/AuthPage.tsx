import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth, UserProfile } from '../AuthContext';
import { Zap, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';

type Tab = 'login' | 'register';

interface AuthPageProps {
  initialTab?: Tab;
  onBack: () => void;
}

const mapFirebaseError = (code: string): string => {
  const map: Record<string, string> = {
    'auth/email-already-in-use': 'Email sudah terdaftar. Coba masuk atau gunakan email lain.',
    'auth/invalid-email': 'Format email tidak valid.',
    'auth/weak-password': 'Password terlalu lemah. Gunakan minimal 8 karakter.',
    'auth/user-not-found': 'Email tidak terdaftar. Coba daftar terlebih dahulu.',
    'auth/wrong-password': 'Password salah. Coba lagi.',
    'auth/invalid-credential': 'Email atau password salah.',
    'auth/too-many-requests': 'Terlalu banyak percobaan. Coba beberapa menit lagi.',
    'auth/network-request-failed': 'Koneksi gagal. Periksa internet kamu.',
  };
  return map[code] || 'Terjadi kesalahan. Coba lagi.';
};

const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const validatePhone = (p: string) => /^(\+62|62|0)[0-9]{8,13}$/.test(p.replace(/\s|-/g, ''));
const validateUsername = (u: string) => /^[a-zA-Z0-9_]{3,20}$/.test(u);

const AuthPage: React.FC<AuthPageProps> = ({ initialTab = 'login', onBack }) => {
  const { setUserProfile } = useAuth();
  const [tab, setTab] = useState<Tab>(initialTab);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Register state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);

  const handleLogin = async () => {
    setLoginError('');
    if (!loginEmail) return setLoginError('Email wajib diisi.');
    if (!validateEmail(loginEmail)) return setLoginError('Format email tidak valid.');
    if (!loginPassword) return setLoginError('Password wajib diisi.');

    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      // onAuthStateChanged in AuthContext will pick up profile automatically
    } catch (err: any) {
      setLoginError(mapFirebaseError(err.code));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegError('');
    if (!regUsername) return setRegError('Username wajib diisi.');
    if (!validateUsername(regUsername)) return setRegError('Username hanya huruf, angka, underscore. 3–20 karakter.');
    if (!regEmail) return setRegError('Email wajib diisi.');
    if (!validateEmail(regEmail)) return setRegError('Format email tidak valid.');
    if (!regPhone) return setRegError('Nomor HP wajib diisi.');
    if (!validatePhone(regPhone)) return setRegError('Format nomor HP tidak valid. Contoh: 08xx atau +62xx.');
    if (!regPassword) return setRegError('Password wajib diisi.');
    if (regPassword.length < 8) return setRegError('Password minimal 8 karakter.');
    if (regPassword !== regConfirm) return setRegError('Konfirmasi password tidak cocok.');

    setRegLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      const profile: UserProfile = {
        uid: cred.user.uid,
        username: regUsername,
        email: regEmail,
        phone: regPhone,
        role: 'user',
        plan: 'free',
      };
      await setDoc(doc(db, 'users', cred.user.uid), {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setUserProfile(profile);
    } catch (err: any) {
      setRegError(mapFirebaseError(err.code));
    } finally {
      setRegLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (tab === 'login') handleLogin();
      else handleRegister();
    }
  };

  return (
    <div className="min-h-screen bg-background text-white relative overflow-hidden font-body" onKeyDown={handleKeyDown}>
      <div className="grid-bg absolute inset-0 pointer-events-none" />
      <div className="orb orb-1" style={{ opacity: 0.08 }} />
      <div className="orb orb-2" style={{ opacity: 0.06 }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <button onClick={onBack} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center shadow-lg shadow-primary/30">
            <Zap className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight group-hover:text-primary transition-colors">
            Nexus Studio
          </span>
        </button>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
      </header>

      {/* Card */}
      <main className="relative z-10 flex items-center justify-center px-4 py-12 min-h-[calc(100vh-88px)]">
        <div className="w-full max-w-md">
          {/* Tabs */}
          <div className="flex rounded-2xl p-1.5 mb-8" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setLoginError(''); setRegError(''); }}
                className="flex-1 py-3 text-sm font-display font-semibold rounded-xl transition-all relative"
                style={{
                  background: tab === t ? '#8b5cf6' : 'transparent',
                  color: tab === t ? 'white' : 'rgba(255,255,255,0.4)',
                  boxShadow: tab === t ? '0 4px 15px rgba(139,92,246,0.3)' : 'none',
                }}
              >
                {t === 'login' ? 'Masuk' : 'Daftar'}
              </button>
            ))}
          </div>

          <div className="rounded-3xl p-8" style={{ background: 'rgba(24,24,27,0.85)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}>
            {tab === 'login' ? (
              <>
                <h2 className="font-display font-bold text-2xl mb-1">Selamat datang kembali</h2>
                <p className="text-sm text-gray-500 mb-8">Masuk ke akun Nexus Studio kamu</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2 ml-1">Email</label>
                    <input
                      type="email"
                      className="auth-input"
                      placeholder="nama@email.com"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2 ml-1">Password</label>
                    <div className="relative">
                      <input
                        type={showLoginPass ? 'text' : 'password'}
                        className="auth-input"
                        placeholder="Password kamu"
                        style={{ paddingRight: '44px' }}
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPass(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                      >
                        {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div className="text-sm text-red-400 rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      {loginError}
                    </div>
                  )}

                  <button
                    onClick={handleLogin}
                    disabled={loginLoading}
                    className="w-full py-4 bg-primary rounded-2xl font-display font-bold text-base btn-glow hover:bg-purple-600 transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loginLoading ? (
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : 'Masuk ke Studio'}
                  </button>
                </div>

                <p className="text-center text-sm text-gray-600 mt-6">
                  Belum punya akun?{' '}
                  <button onClick={() => setTab('register')} className="text-primary hover:text-purple-400 transition-colors font-medium">
                    Daftar sekarang
                  </button>
                </p>
              </>
            ) : (
              <>
                <h2 className="font-display font-bold text-2xl mb-1">Buat akun baru</h2>
                <p className="text-sm text-gray-500 mb-8">Bergabung dan mulai berkreasi hari ini</p>

                <div className="space-y-4">
                  {[
                    { label: 'Username', id: 'username', type: 'text', placeholder: 'username_unik', value: regUsername, onChange: setRegUsername },
                    { label: 'Email', id: 'email', type: 'email', placeholder: 'nama@email.com', value: regEmail, onChange: setRegEmail },
                    { label: 'Nomor HP', id: 'phone', type: 'tel', placeholder: '08xxxxxxxxxx', value: regPhone, onChange: setRegPhone },
                  ].map(f => (
                    <div key={f.id}>
                      <label className="block text-xs font-medium text-gray-400 mb-2 ml-1">{f.label}</label>
                      <input
                        type={f.type}
                        className="auth-input"
                        placeholder={f.placeholder}
                        value={f.value}
                        onChange={e => f.onChange(e.target.value)}
                      />
                    </div>
                  ))}

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2 ml-1">Password</label>
                    <div className="relative">
                      <input
                        type={showRegPass ? 'text' : 'password'}
                        className="auth-input"
                        placeholder="Min. 8 karakter"
                        style={{ paddingRight: '44px' }}
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                      />
                      <button type="button" onClick={() => setShowRegPass(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
                        {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2 ml-1">Konfirmasi Password</label>
                    <input
                      type="password"
                      className="auth-input"
                      placeholder="Ulangi password"
                      value={regConfirm}
                      onChange={e => setRegConfirm(e.target.value)}
                    />
                  </div>

                  {regError && (
                    <div className="text-sm text-red-400 rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      {regError}
                    </div>
                  )}

                  <button
                    onClick={handleRegister}
                    disabled={regLoading}
                    className="w-full py-4 bg-primary rounded-2xl font-display font-bold text-base btn-glow hover:bg-purple-600 transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {regLoading ? (
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : 'Daftar & Mulai Berkreasi'}
                  </button>
                </div>

                <p className="text-center text-xs text-gray-600 mt-6 leading-relaxed">
                  Dengan mendaftar, kamu menyetujui<br />
                  <span className="text-gray-500">Syarat Penggunaan dan Kebijakan Privasi</span> kami
                </p>

                <p className="text-center text-sm text-gray-600 mt-4">
                  Sudah punya akun?{' '}
                  <button onClick={() => setTab('login')} className="text-primary hover:text-purple-400 transition-colors font-medium">
                    Masuk di sini
                  </button>
                </p>
              </>
            )}
          </div>

          <p className="text-center text-xs text-gray-700 mt-6 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3 h-3" />
            Diproteksi Firebase Authentication · Data terenkripsi
          </p>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
