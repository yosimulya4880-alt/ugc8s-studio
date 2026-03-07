# UGC8s Studio (Vertex Build UI) + Backend Cloud Run

Project ini terdiri dari:
- **Frontend UI** (Vertex AI Studio Build / Vite + React)
- **Backend API** (Cloud Run: ugc8s-api) untuk:
  - Signed upload ke GCS
  - Job store (GCS JSON)
  - Generate Nano (Gemini image) + signed result URL
  - Generate VEO (sementara mock / test finalize)

---

## Struktur Repo

- `antarmuka pengguna/` (Frontend UI)
  - `Aplikasi.tsx`  (App.tsx)
  - `layanan/api.ts` (services/api.ts)
  - `komponen/JobCard.tsx`
  - `tipe.ts` (types.ts)
  - `indeks.html`, `indeks.tsx`, `paket.json`, `vite.config.ts`, dll

- `backend/` (Cloud Run backend)
  - `server.js` (atau `index.js`)
  - `paket.json` (package.json)
  - (opsional) `Dockerfile`

> Catatan: Nama folder/file mengikuti hasil export Vertex Build. Bebas mau dirapikan nanti.

---

## Konfigurasi ENV (Cloud Run)

Backend Cloud Run membutuhkan ENV:
- `OUTPUT_BUCKET` = bucket output (mis: `ugc-output-aibot-2026`)
- `DUMMY_TOKEN` = token untuk Authorization (mis: `ugc8s-demo-123`)
- `GEMINI_API_KEY` = API key Gemini (yang bisa generate image)
- `NANO_API_MODEL` = `gemini-3.1-flash-image-preview`
- `SIGNED_URL_TTL_MIN` = `60` (opsional)
- `TEST_FINALIZE` = `true/false` (opsional, untuk VEO mock finalize)

⚠️ Jangan pernah commit nilai `GEMINI_API_KEY` / token ke GitHub.

---

## Recovery cepat ketika Vertex Build rollback / restore checkpoint (1 menit)

Kadang Vertex AI Studio Build melakukan restore ke checkpoint lama ketika terjadi error/429.
Jika UI menjadi blank atau muncul error import (mis. `signUpload export missing`), lakukan langkah berikut:

### A) Pastikan 4 file inti selalu versi paling benar

Urutan paste yang disarankan (biar type/import konsisten):
1. `tipe.ts` (types)
2. `layanan/api.ts` (services/api)  ✅ harus export `signUpload`
3. `komponen/JobCard.tsx`
4. `Aplikasi.tsx` (App.tsx)

Setelah paste:
- **Save** di editor Build
- refresh (kalau perlu)

### B) Checklist cepat
- `layanan/api.ts` harus punya:
  - `export async function signUpload(...)`
  - `export async function generateMedia(...)`
  - `export async function getJobStatus(...)`
- Request `/generate/nano` harus 200 dan Authorization header harus `Bearer <token>` (bukan `[object FormData]`).

---

## Cara test backend (Cloud Shell)

PATCH: View Media tidak error pada signed URL yang kadaluarsa

Masalah utama:
- URL hasil generate memakai signed URL GCS.
- Signed URL ini punya masa berlaku terbatas (contoh: X-Goog-Expires=3600 = 1 jam).
- Jika Job History menyimpan URL lama, tombol View Media akan gagal setelah URL kadaluarsa.

Solusi frontend:
1. Saat klik View Media, jangan langsung selalu pakai URL lama dari history.
2. Cek apakah URL kosong / invalid / signed URL kadaluarsa.
3. Jika ya, panggil ulang GET /jobs/:id untuk ambil result.url terbaru.
4. Baru buka URL terbaru itu.

Jika mock mode masih error walaupun refresh job:
- backend mock kemungkinan tidak mengirim result.url yang valid.
- perbaikan backend yang ideal: mock mode tetap mengembalikan result.url placeholder yang bisa diakses browser.

File patch:
- frontend/services/api.ts -> tambah getJob(...)
- frontend/components/JobCard.tsx -> refresh latest job sebelum buka media

Set URL:
```bash
SERVICE_URL="$(gcloud run services describe ugc8s-api --region asia-southeast1 --format='value(status.url)')"
TOKEN="ugc8s-demo-123"
