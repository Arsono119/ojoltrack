# 🛵 OjolTrack — Pencatat & Analisis Pendapatan Ojol Otomatis

> **PWA untuk driver Shopee Drive & Grab** — catat order <10 detik, hitung **Rp/KM otomatis**, bandingkan platform, lihat grafik & jam tersibuk. Offline-first, tanpa login, data di HP Anda.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)
[![PWA](https://img.shields.io/badge/PWA-Serwist-5A0FC8?style=for-the-badge)](https://serwist.pages.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Recharts](https://img.shields.io/badge/Recharts-3-FF6B6B?style=for-the-badge)](https://recharts.org)

**Live Demo:** `https://ojoltrack.vercel.app` _(deploy setelah push)_ · **Repo:** `Arsono119/ojoltrack`

---

## 🎯 Kenapa OjolTrack?

Driver ojol (penulis — driver Shopee Drive & Grab paruh waktu) biasanya:
- Tidak tahu **pendapatan bersih** setelah bensin/makan/servis
- Tidak tahu **jam/hari mana paling cuan** dan **platform mana lebih worth it per KM**
- Malas catat manual — rawan lupa, buang waktu

Aplikasi Gojek/Grab menampilkan riwayat, tapi **tidak ada insight Rp/KM & pengeluaran vs bersih**. OjolTrack mengisi celah itu — **1 tap tambah order, Rp/KM langsung kehitung, grafik langsung jadi.**

---

## ✨ Fitur

| Fitur | Detail | Status |
|---|---|---|
| **⚡ Input <10 detik** | Toggle Pendapatan/Pengeluaran, default tanggal=hari ini & waktu=now, kategori auto dari catatan | ✅ MVP |
| **💰 Kalkulasi Rp/KM** | `Rp/KM = Argo / Jarak` — auto, null-safe jika jarak kosong (disalin dari estimasi di aplikasi ojol) | ✅ |
| **📊 Dashboard Harian** | Pendapatan Bersih besar hijau, 2 kartu pemasukan/pengeluaran, rata-rata Rp/KM + per-platform (Shopee Drive vs Grab) | ✅ |
| **📋 Riwayat** | Group per tanggal (Hari ini/Kemarin), filter platform, search, hapus, **Export CSV** anti-injection | ✅ |
| **📈 Grafik & Insight** | Tren Bersih 7/30 hari (Line), tren Rp/KM (Bar), histogram **Jam Tersibuk** 24 jam | ✅ |
| **📷 Screenshot Struk (Fase 2)** | Upload foto struk → OpenRouter (free) → Groq fallback → ekstrak `nominal/jarak/platform/waktu` → **konfirmasi editable** (tidak auto-save) | 🚧 Hide flag `ENABLE_VISION=false` |
| **📱 PWA Offline** | `localStorage["ojoltrack_transaksi"]`, Serwist precache, `Add to Home Screen`, indikator offline, tetap simpan saat sinyal hilang | ✅ |
| **🧠 Memory Form** | Ingat pilihan terakhir (`pendapatan Grab` / `pengeluaran servis`) → buka form lagi otomatis terpilih | ✅ |
| **🔒 Aman** | Zod validation, CSP/HSTS headers, CSV injection guard (`'=HYPERLINK`), quota handling, 0 audit vuln | ✅ |

---

## 🖼️ Wireframe → Realita

| Wireframe | Halaman | Deskripsi |
|---|---|---|
| §1 | `/` Dashboard | Net hijau besar + 2 kartu + avg Rp/KM per platform + FAB **＋ Tambah** |
| §2 | `/tambah` | Toggle Pendapatan/Pengeluaran, Segmented Shopee/Grab, Argo + sub `18.000`, Jarak + hint, live `→ Rp/KM 2.903` |
| §3 | Confirm | Preview foto + fields editable ✏️ + warning ⚠️ |
| §4 | `/riwayat` | Group tanggal, filter chips Semua/Shopee/Grab/Pengeluaran |
| §5 | `/grafik` | Toggle Minggu/Bulan, Tren Bersih, Perbandingan Rp/KM, Jam Tersibuk |

---

## 🧱 Tech Stack

| Layer | Pilihan | Kenapa |
|---|---|---|
| Framework | **Next.js 16 App Router + TS** | File-based routing, Route Handler untuk vision |
| Styling | **Tailwind CSS 4** | Mobile-first, `max-w-md` centered |
| PWA | **@serwist/next 9.x** | Penerus next-pwa, Next 16 compat, `NetworkOnly` untuk `/api` |
| Storage | **LocalStorage** `ojoltrack_transaksi` + Zod | MVP offline tanpa server, siap migrasi Dexie/Supabase (tambah `user_id`) |
| Chart | **Recharts** `dynamic(ssr:false)` | Ringan, 180kb |
| Vision | **OpenRouter (free)** → **Groq** fallback | Abstraction `lib/vision.ts`, 15s timeout, no leak |
| Date/ID | `nanoid` + native `Date` | Tanpa `date-fns` (dead dep removed) |

---

## 🗃️ Data Model

Field **snake_case** (sesuai `Data_Model_OjolTrack.md`):

```ts
{
  id: string,                    // nanoid()
  tipe: "pendapatan" | "pengeluaran",
  tanggal: "YYYY-MM-DD",         // terpisah
  waktu: "HH:mm" | null,
  nominal: number,               // integer rupiah, tanpa separator
  platform: "Shopee Drive"|"Grab"|"Lainnya"|null,  // hanya pendapatan
  jarak_km: number | null,       // estimasi dari aplikasi, nullable
  rp_per_km: number | null,      // Math.round(nominal / jarak_km) — never dari LLM
  kategori: "bensin"|"makan"|"servis"|"lainnya"|null,
  catatan: string | null,
  sumber_input: "manual" | "screenshot",
  created_at: string             // ISO
}
```

```ts
rp_per_km = jarak_km ? Math.round(nominal / jarak_km) : null
```

---

## 🚀 Cara Jalan (Lokal)

```bash
git clone https://github.com/Arsono119/ojoltrack
cd ojoltrack
npm install
# vision butuh key hanya jika ENABLE_VISION=true (Fase 2)
cp .env.local.example .env.local
# OPENROUTER_API_KEY=sk-or-...
# GROQ_API_KEY=gsk_...

npm run dev    # http://localhost:3000
npm run build  # production (PWA aktif)
npm run lint   # 0 error
```

**Test cepat:**
1. Buka `/` → klik **Isi contoh** (seed 10 transaksi) → dashboard & grafik langsung terisi
2. `/tambah` → `pendapatan Grab 18.000 / 6.2 km 08:15` → preview `2903` → Simpan
3. Coba `pengeluaran servis 25.000` → lihat sub `25.000` → Simpan → buka `/tambah` lagi → otomatis `pengeluaran servis` (memory)

---

## 📱 PWA

- `app/manifest.ts` + `app/sw.ts` (Serwist `defaultCache` + `NetworkOnly` untuk `/api`)
- `next.config.ts` headers: CSP, HSTS, XFO, nosniff
- Test: `npm run build && npm run start` → DevTools > Application > Manifest

---

## 🗺️ Roadmap

- [x] Fase 1 — MVP manual + dashboard (Task 1.1-1.10)
- [x] Fase 3 — Grafik & jam tersibuk (Task 3.1-3.5)
- [x] Fase 4 — PWA & polish + memory
- [ ] Fase 2 — Vision screenshot (flip `lib/config.ts: ENABLE_VISION=true` + 10 fixtures Shopee/Grab)
- [ ] Cloud sync (Supabase) — tambah `user_id`, multi-device

---

## 🔒 Keamanan

- `npm audit` 0 vuln (browserslist overridden)
- Zod strict di `importJSON` + `add`, CSV `'=HYPERLINK` guard, quota `QuotaExceededError`, CSP/HSTS
- Review: `code-reviewer` + `security-reviewer` — 0 Critical di MVP

---

## 👨‍💻 Untuk Portofolio

**Masalah nyata → solusi nyata → bisa didemokan end-to-end** (foto struk → simpan → grafik). Cocok untuk showcase "PWA offline-first + perhitungan bisnis + UX <10 detik" — bukan CRUD biasa. Tambahkan link demo Vercel di LinkedIn/CV.

**Dibuat oleh:** Arsono119 — driver Shopee Drive & Grab paruh waktu, staff bandara. [LinkedIn] · [Vercel Live]

---

## 📄 Dokumen

- PRD, Data Model, Task Breakdown, Wireframe — lihat `docs/` & `~/.opencode/plans/`
- Plan: `ojoltrack-pencatat-pendapatan-ojol-otomatis.md`
- Deletion Log: `docs/DELETION_LOG.md`

