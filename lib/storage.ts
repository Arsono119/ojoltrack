import type { Transaksi } from "./types";
import { z } from "zod";
import { calcRpPerKm } from "./calc";

const KEY = "ojoltrack_transaksi";

const TransaksiSchema = z.object({
  id: z.string().min(1),
  tipe: z.enum(["pendapatan", "pengeluaran"]),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  waktu: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  nominal: z.number().int().positive().max(1_000_000_000),
  platform: z.enum(["Shopee Drive", "Grab", "Lainnya"]).nullable(),
  jarak_km: z.number().positive().nullable(),
  rp_per_km: z.number().int().nullable(),
  kategori: z.enum(["bensin", "makan", "servis", "lainnya"]).nullable(),
  catatan: z.string().max(500).nullable(),
  sumber_input: z.enum(["manual", "screenshot"]),
  created_at: z.string().datetime({ offset: true }).or(z.string().min(1)),
});

function isStorageAvailable(): boolean {
  try {
    const k = "__ojoltrack_test";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

function readRaw(): Transaksi[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("[storage] corrupt, resetting", e);
    try { localStorage.removeItem(KEY); } catch {}
    return [];
  }
}

function writeRaw(data: Transaksi[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    // notify same-tab listeners (replaces 800ms polling)
    window.dispatchEvent(new Event("ojoltrack:change"));
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      throw new Error("Penyimpanan penuh — export & hapus data lama");
    }
    throw e;
  }
}

export const storage = {
  KEY,
  getAll(): Transaksi[] {
    return readRaw();
  },
  getByTanggal(tanggal: string): Transaksi[] {
    return readRaw().filter((t) => t.tanggal === tanggal);
  },
  add(t: Transaksi) {
    if (!isStorageAvailable()) throw new Error("Penyimpanan tidak tersedia di browser ini");
    const all = readRaw();
    // enforce invariant
    const normalized = { ...t };
    if (normalized.tipe === "pendapatan") normalized.rp_per_km = calcRpPerKm(normalized.nominal, normalized.jarak_km);
    else { normalized.jarak_km = null; normalized.rp_per_km = null; }
    all.push(normalized);
    writeRaw(all);
  },
  update(id: string, patch: Partial<Transaksi>) {
    const all = readRaw();
    const idx = all.findIndex((t) => t.id === id);
    if (idx !== -1) {
      const next = { ...all[idx], ...patch } as Transaksi;
      // enforce invariant: recompute rp_per_km, don't trust caller
      if (next.tipe === "pendapatan") next.rp_per_km = calcRpPerKm(next.nominal, next.jarak_km);
      else { next.jarak_km = null; next.rp_per_km = null; }
      all[idx] = next;
      writeRaw(all);
    }
  },
  remove(id: string) {
    const all = readRaw().filter((t) => t.id !== id);
    writeRaw(all);
  },
  clear() {
    if (typeof window !== "undefined") localStorage.removeItem(KEY);
  },
  exportJSON(): string {
    return JSON.stringify(readRaw(), null, 2);
  },
  importJSON(json: string): { ok: number; skip: number } {
    let arr: unknown;
    try {
      arr = JSON.parse(json);
    } catch {
      return { ok: 0, skip: 0 };
    }
    if (!Array.isArray(arr)) return { ok: 0, skip: 0 };
    const existing = readRaw();
    let ok = 0,
      skip = 0;
    for (const item of arr) {
      // reject prototype pollution keys
      if (item && typeof item === "object" && ("__proto__" in (item as object) || "constructor" in (item as object))) {
        skip++;
        continue;
      }
      const parsed = TransaksiSchema.safeParse(item);
      if (!parsed.success) {
        skip++;
        continue;
      }
      const t = parsed.data as Transaksi;
      // recompute invariant (don't trust imported rp_per_km)
      if (t.tipe === "pendapatan") t.rp_per_km = calcRpPerKm(t.nominal, t.jarak_km);
      else { t.jarak_km = null; t.rp_per_km = null; }
      if (existing.some((e) => e.id === t.id)) {
        skip++;
        continue;
      }
      existing.push(t);
      ok++;
    }
    writeRaw(existing);
    return { ok, skip };
  },
};

export type Storage = typeof storage;
