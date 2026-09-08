# OjolTrack — Pencatat & Analisis Pendapatan Ojol Otomatis

PWA mobile-first untuk driver ojol (Shopee Drive & Grab) mencatat pendapatan & pengeluaran <10 detik/entri, menghitung **Rp/KM = Argo / Jarak**, membandingkan platform, dan menampilkan insight harian/mingguan + grafik + jam tersibuk.

> **Stack:** Next.js 15 (App Router) + Tailwind 4 + Serwist PWA + LocalStorage (`ojoltrack_transaksi`) + Recharts + OpenRouter/Groq Vision

## ✨ Fitur (sesuai PRD + Data_Model + Wireframe)

- **Input manual** pendapatan (platform, argo, jarak KM opsional → auto Rp/KM) & pengeluaran (kategori auto)
- **Upload screenshot struk** → AI Vision (OpenRouter free → Groq fallback) ekstrak nominal/jarak/platform → **konfirmasi editable** sebelum simpan (tidak auto-save)
- **Dashboard** — Pendapatan Bersih besar hijau, 2 kartu pemasukan/pengeluaran, rata-rata Rp/KM + per-platform Shopee Drive vs Grab
- **Riwayat** — grouped per tanggal, filter platform, cari, hapus, Export CSV
- **Grafik** — tren bersih mingguan/bulanan, tren Rp/KM, histogram jam tersibuk
- **PWA offline** — LocalStorage tetap simpan saat offline, Serwist precache, Add to Home Screen
- **Seed demo** — tombol "Isi contoh" untuk demo portofolio

## 🗃️ Data Model

Lihat `~/Downloads/Data_Model_OjolTrack.md` — field snake_case, storage `localStorage["ojoltrack_transaksi"]`:

```ts
{ id, tipe: "pendapatan"|"pengeluaran", tanggal: "YYYY-MM-DD", waktu: "HH:mm"|null, nominal, platform, jarak_km, rp_per_km, kategori, catatan, sumber_input, created_at }
```

`rp_per_km = Math.round(nominal / jarak_km)` — dihitung di `lib/calc.ts`, never oleh LLM.

## 🚀 Cara Jalan

```bash
cd ~/ojoltrack
npm install
cp .env.local.example .env.local  # isi OPENROUTER_API_KEY atau GROQ_API_KEY untuk vision
npm run dev    # http://localhost:3000
npm run build  # production build (Serwist aktif hanya di production)
```

## 🔑 Env

```
OPENROUTER_API_KEY=sk-or-...   # free tier: qwen/qwen-2-vl:free
GROQ_API_KEY=gsk_...           # fallback
```

Vision abstraction: `lib/vision.ts` → `OPENROUTER_API_KEY` diprioritaskan, fallback ke Groq.

## 📱 PWA

- `app/manifest.ts` + `app/sw.ts` (Serwist `defaultCache`, precache shell)
- `next.config.ts` withSerwist `{ swSrc: app/sw.ts, swDest: public/sw.js, disable: dev }`
- Test: `npm run build && npm run start` → Chrome DevTools > Application > Manifest & Service Workers

## 🧪 Task Breakdown

Lihat `~/Downloads/Task_Breakdown_OjolTrack.md` — Fase 1 (1.1–1.10) → Fase 3 (grafik) → Fase 4 (PWA) → Fase 2 (vision). Prioritas: Fase 1 penuh > grafik > PWA > vision.

## 📸 Demo Flow (untuk portofolio)

1. Buka `/` → klik "Isi contoh" (seed) → dashboard & grafik langsung terisi
2. Tambah manual: `/tambah` → Grab 18.000 / 6.2 km 08:15 → preview Rp/KM 2903 → Simpan → cek dashboard update
3. Riwayat: filter Shopee Drive → cek Rp/KM bar beda
4. Screenshot (butuh API key): Upload struk Grab/Shopee → konfirmasi editable → Simpan
5. Offline: DevTools offline → tambah transaksi → reload → data tetap ada

## 🚢 Deploy Vercel

```bash
git init && git add . && git commit -m "feat: OjolTrack MVP"
# push ke GitHub lalu import di vercel.com
# atau: npx vercel --prod
# set env OPENROUTER_API_KEY di Vercel dashboard
```

## 📄 Dokumen

- PRD: prompt user
- Data Model: `~/Downloads/Data_Model_OjolTrack.md`
- Task Breakdown: `~/Downloads/Task_Breakdown_OjolTrack.md`
- Wireframe: `~/Downloads/Wireframe_OjolTrack.md`
- Plan: `~/.opencode/plans/ojoltrack-pencatat-pendapatan-ojol-otomatis.md`
