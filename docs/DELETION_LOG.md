# Code Deletion Log

## [2026-09-09] Refactor & Dead Code Scan — OjolTrack

### Scan Tools
- depcheck (found date-fns unused)
- manual grep for public assets & exports
- knip OOM (skipped, manual review instead)
- eslint --report-unused-disable-directives (0 unused)
- ts-prune manual (checked lib exports)

### Unused Files Deleted (Batch 1 — SAFE)

- `public/file.svg` — create-next-app template, no references found (grep 0)
- `public/globe.svg` — same
- `public/next.svg` — same
- `public/vercel.svg` — same
- `public/window.svg` — same
- Total: 5 files

### Unused Dependencies Removed (Batch 2 — SAFE)

- `date-fns@4.4.0` — installed but never imported in src (grep --exclude-dir=node_modules 0 hits)
  - Size: ~300 KB, Last used: never
  - Reason: project uses native Date + ISO string (todayISODate), no date-fns API needed for MVP
  - Verification: `grep -r "from \"date-fns"` 0 results, build still passes

### Unused Exports Removed (Batch 3 — SAFE)

- `lib/parse.ts` — `formatRupiah()` — duplicate of `formatRupiahShort()`, 0 references (only Short is used in app/page.tsx)
- `lib/parse.ts` — `nowHHMM()` — 0 references (TransactionForm uses inline `nowTime()`)
- Reason: dead code, keep single source `formatRupiahShort` + inline helpers
- Note: kept `exportToBlob` and `parseCSV` in lib/export.ts — currently 0 refs but intended for future CSV import (Fase 1.8/3.5), marked DO NOT REMOVE

### Kept (NOT removed — when in doubt, don't)

- `lib/vision.ts`, `lib/visionPrompt.ts`, `components/ScreenshotConfirm.tsx`, `app/api/extract/route.ts` — gated by `ENABLE_VISION=false` but needed for Fase 2, not dead
- `lib/export.ts:exportToBlob`, `parseCSV` — future import feature, 0 refs today but planned
- `browserslist`, `@tailwindcss/postcss`, `tailwindcss`, `@types/*` — depcheck flagged but required for build (verified: Tailwind 4 + Next 16 need them)

### Impact

- Files deleted: 5
- Dependencies removed: 1
- Exports removed: 2 functions
- Lines removed: ~30
- Bundle reduction: ~0 KB (SVGs not bundled), ~300 KB node_modules saved
- Build: passing, Tests: N/A (no test suite yet), Manual: dashboard/riwayat/grafik/tambah verified via curl

### Testing

- `npx tsc --noEmit` — passing
- `npm run lint` — 0 errors
- `npm run build` — passing (9/9 pages)
- `npm audit` — 0 vulnerabilities (after previous browserslist fix)

### Risk

- SAFE batch only. No dynamic imports affected. Grep verified 0 references before each deletion.
- Rollback: `git revert <commit>` + `npm i date-fns` if needed

