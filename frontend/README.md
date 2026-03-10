# Nexus Studio — AI Creative Platform

Platform generasi konten video & gambar berbasis AI, dengan autentikasi Firebase terintegrasi.

## 🚀 Cara Menjalankan

### 1. Install semua dependency

```bash
npm install
```

### 2. Jalankan frontend + backend sekaligus

```bash
npm run dev
```

Frontend akan berjalan di: **http://localhost:5173**  
Backend API proxy berjalan di: **http://localhost:5000**

---

### Atau jalankan terpisah:

**Frontend saja:**
```bash
npm run dev-frontend
```

**Backend saja** (butuh file `.env.local` di folder `backend/`):
```bash
npm run dev-backend
```

---

## 🔐 Firebase Auth & Firestore

Firebase sudah dikonfigurasi. Fitur:
- **Welcome page** dengan landing page lengkap
- **Daftar** dengan username, email, nomor HP, password
- **Login** dengan email & password
- **Session persistent** — tidak perlu login ulang saat refresh
- **User profile** disimpan di Firestore `users/{uid}`

### Deploy Firestore Rules

Buka Firebase Console → Firestore → Rules → paste isi `firestore.rules` → Publish

### Deploy Indexes

```bash
firebase deploy --only firestore:indexes
```

---

## 📁 Struktur Project

```
nexus-studio/
├── frontend/
│   ├── App.tsx              ← Router utama (auth gating)
│   ├── StudioApp.tsx        ← Studio app (video/image generation)
│   ├── AuthContext.tsx      ← Firebase auth state global
│   ├── firebase.ts          ← Firebase config
│   ├── styles.css           ← Global CSS (orbs, animations, auth)
│   ├── components/
│   │   ├── WelcomePage.tsx  ← Landing page
│   │   ├── AuthPage.tsx     ← Login & Register
│   │   ├── JobCard.tsx
│   │   ├── PromptGeneratorPanel.tsx
│   │   └── ui/
│   └── services/
├── backend/
│   └── server.js            ← Express API proxy
├── firestore.rules          ← Security rules Firestore
├── firestore.indexes.json   ← Composite indexes
└── package.json
```

## ⚙️ Backend Environment

Buat file `backend/.env.local`:
```
PORT=5000
# tambahkan credential Google Cloud di sini
```
