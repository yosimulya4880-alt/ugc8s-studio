import React from 'react';
import { Zap, Video, Image as ImageIcon, Star } from 'lucide-react';

interface WelcomePageProps {
  onShowAuth: (tab: 'login' | 'register') => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onShowAuth }) => {
  return (
    <div className="min-h-screen bg-background text-white relative overflow-hidden font-body">
      {/* Background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      {/* Grid */}
      <div className="grid-bg absolute inset-0 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center shadow-lg shadow-primary/30">
            <Zap className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Nexus Studio</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onShowAuth('login')}
            className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
          >
            Masuk
          </button>
          <button
            onClick={() => onShowAuth('register')}
            className="text-sm bg-primary hover:bg-purple-600 transition-all px-5 py-2.5 rounded-xl font-medium btn-glow"
          >
            Daftar Gratis
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="slide-up">
          <span className="badge-pill">✦ Platform AI Kreasi Generasi Baru</span>
        </div>

        <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-extrabold mt-8 mb-6 leading-[0.95] tracking-tight slide-up-delay">
          Ciptakan Konten<br />
          <span className="gradient-text">Visual Luar Biasa</span>
        </h1>

        <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed slide-up-delay-2">
          Nexus Studio menggabungkan model AI terdepan untuk menghasilkan video sinematik dan
          gambar berkualitas tinggi. Dari prompt sederhana ke karya visual memukau — dalam hitungan detik.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-10 slide-up-delay-3">
          <button
            onClick={() => onShowAuth('register')}
            className="px-8 py-4 bg-primary rounded-2xl font-display font-bold text-lg btn-glow hover:bg-purple-600 transition-all"
          >
            Mulai Gratis Sekarang →
          </button>
          <button
            onClick={() => onShowAuth('login')}
            className="px-8 py-4 rounded-2xl font-display font-bold text-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-gray-300"
          >
            Sudah punya akun
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-12 mt-16 slide-up-delay-3">
          <div className="text-center">
            <div className="font-display font-extrabold text-3xl text-white">Veo</div>
            <div className="text-xs text-gray-500 mt-1">Video Engine</div>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="text-center">
            <div className="font-display font-extrabold text-3xl text-white">Nano</div>
            <div className="text-xs text-gray-500 mt-1">Image Engine</div>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="text-center">
            <div className="font-display font-extrabold text-3xl text-white">4K</div>
            <div className="text-xs text-gray-500 mt-1">Max Resolution</div>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="relative z-10 px-8 py-20 max-w-6xl mx-auto w-full">
        <div className="text-center mb-14">
          <h2 className="font-display font-bold text-4xl mb-4">Semua yang kamu butuhkan</h2>
          <p className="text-gray-500 text-base">Satu platform untuk semua kebutuhan konten AI visual</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: <Video className="w-5 h-5" style={{ color: '#a78bfa' }} />,
              title: 'Video Generation',
              desc: 'Hasilkan video sinematik dari teks, gambar, atau frame. Gunakan model Veo dengan kontrol motion style, aspect ratio, dan durasi penuh.',
              tags: ['Text-to-Video', 'Image-to-Video', 'Frame Control'],
            },
            {
              icon: <ImageIcon className="w-5 h-5" style={{ color: '#a78bfa' }} />,
              title: 'Image Generation',
              desc: 'Buat ilustrasi, product photo, poster, dan logo dari deskripsi teks. Model Nano memberikan hasil photorealistic hingga illustration style.',
              tags: ['Text-to-Image', 'Reference-based', 'Up to 4K'],
            },
            {
              icon: <Star className="w-5 h-5" style={{ color: '#a78bfa' }} />,
              title: 'Prompt Generator',
              desc: 'Bangun prompt sempurna dengan generator berbasis parameter — pilih subjek, mood, lighting, dan motion style untuk hasil terbaik.',
              tags: ['AI-Assisted', 'Style Lock', 'Job History'],
            },
          ].map((f) => (
            <div key={f.title} className="feature-card rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                {f.icon}
              </div>
              <h3 className="font-display font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {f.tags.map(t => (
                  <span key={t} className="text-xs px-2 py-1 rounded-lg text-gray-400" style={{ background: 'rgba(255,255,255,0.05)' }}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="relative z-10 px-8 pb-24 max-w-4xl mx-auto w-full">
        <div className="rounded-3xl p-10 text-center about-card">
          <span className="badge-pill">Tentang Platform</span>
          <h2 className="font-display font-bold text-3xl mt-6 mb-4">Dibuat untuk kreator modern</h2>
          <p className="text-gray-400 leading-relaxed text-base max-w-2xl mx-auto">
            Nexus Studio adalah platform generasi konten AI yang dirancang untuk brand, kreator, dan tim
            marketing yang membutuhkan visual berkualitas tinggi secara cepat dan konsisten.
            Didukung oleh model AI terbaru dengan kontrol kreatif penuh — tanpa perlu keahlian teknis.
          </p>
          <button
            onClick={() => onShowAuth('register')}
            className="mt-8 px-8 py-3.5 bg-primary rounded-xl font-display font-bold btn-glow hover:bg-purple-600 transition-all"
          >
            Mulai Berkreasi →
          </button>
        </div>
      </section>

      <footer className="relative z-10 px-8 py-6 border-t text-center text-xs text-gray-600" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        © 2026 Nexus Studio · Semua hak dilindungi · Powered by Google Veo & Nano AI
      </footer>
    </div>
  );
};

export default WelcomePage;
