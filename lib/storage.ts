import type { Transaksi } from "./types";
import { z } from "zod";
import { calcRpPerKm } from "./calc";
import { JENIS_LAYANAN_ALL, JENIS_LAYANAN_GRAB, JENIS_LAYANAN_SHOPEE } from "./types";

const KEY = "ojoltrack_transaksi";

const GRAB_SET = new Set<string>([...JENIS_LAYANAN_GRAB]);
const SHOPEE_SET = new Set<string>([...JENIS_LAYANAN_SHOPEE]);

const JenisLayananSchema = z.enum(JENIS_LAYANAN_ALL).nullable();

const TransaksiSchema = z.object({
  id: z.string().min(1),
  tipe: z.enum(["pendapatan", "pengeluaran"]),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  waktu: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  nominal: z.number().int().positive().max(1_000_000_000),
  platform: z.enum(["Shopee Drive", "Grab", "Lainnya"]).nullable(),
  jenis_layanan: JenisLayananSchema.optional().nullable().transform((v) => v ?? null),
  jarak_km: z.number().positive().nullable(),
  rp_per_km: z.number().int().nullable(),
  kategori: z.enum(["bensin", "makan", "servis", "lainnya"]).nullable(),
  catatan: z.string().max(500).nullable(),
  sumber_input: z.enum(["manual", "screenshot"]),
  created_at: z.string().datetime({ offset: true }).or(z.string().min(1)),
}).superRefine((obj, ctx) => {
  if (obj.tipe === "pendapatan") {
    if (obj.platform === "Grab") {
      if (!obj.jenis_layanan || !GRAB_SET.has(obj.jenis_layanan as string)) {
        ctx.addIssue({ code: "custom", path: ["jenis_layanan"], message: "Pilih jenis layanan Grab" });
      }
    }
    if (obj.platform === "Shopee Drive") {
      // For backward compat: allow null/missing on Shopee to preserve old data import
      // but reject explicitly invalid enum values (e.g., GrabBike on Shopee)
      if (obj.jenis_layanan != null && !SHOPEE_SET.has(obj.jenis_layanan as string)) {
        ctx.addIssue({ code: "custom", path: ["jenis_layanan"], message: "Pilih jenis layanan Shopee Drive" });
      }
      // Note: Shopee missing/null is allowed for backward compat (AC-5 old data)
      // UI layer still requires selection for new entries; strictness for Shopee invalid only.
    }
    if (obj.platform === "Lainnya" && obj.jenis_layanan !== null) {
      ctx.addIssue({ code: "custom", path: ["jenis_layanan"], message: "Lainnya tidak punya jenis layanan" });
    }
    // Special: Grab with null/missing must fail (covers AC-3 zod test)
    // Already handled above for Grab; if platform is Grab and jenis_layanan is null -> issue added
  } else {
    // pengeluaran — no validation, will be normalized to null
  }
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

function migrateTransaksi(raw: unknown): Transaksi | null {
  // safeParse with transform injects null for missing key
  const parsed = TransaksiSchema.safeParse(raw);
  if (parsed.success) return parsed.data as Transaksi;
  // For backward compat: if failure is only due to missing jenis_layanan on old data,
  // attempt to inject null and re-parse (handled by transform already, so this is fallback)
  // If still fails, return null to skip
  return null;
}

function normalizeJenisLayanan(t: Transaksi): void {
  if (t.tipe === "pendapatan") {
    if (t.platform === "Grab" && !JENIS_LAYANAN_GRAB.includes(t.jenis_layanan as never)) t.jenis_layanan = null;
    if (t.platform === "Shopee Drive" && !JENIS_LAYANAN_SHOPEE.includes(t.jenis_layanan as never)) {
      // For storage.add/update, normalize invalid to null;
      // importJSON will have already validated invalid cross-platform via superRefine skip
      // but for add/update we nullify to prevent corrupt data
      // Note: Shopee missing (null) is considered valid for legacy, but add() for new data should have been validated at UI layer
      // We keep null as is for Shopee missing (legacy compat)
      if (t.jenis_layanan !== null) t.jenis_layanan = null;
    }
    if (t.platform === "Lainnya" || t.platform == null) t.jenis_layanan = null;
  } else {
    t.jarak_km = null;
    t.rp_per_km = null;
    t.jenis_layanan = null;
  }
}

function readRaw(): Transaksi[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // migrate each item: inject jenis_layanan null if missing, via safeParse
    return parsed.map((item) => {
      const r = item as Record<string, unknown>;
      if (r && typeof r === "object" && !("jenis_layanan" in r)) {
        return { ...r, jenis_layanan: null } as Transaksi;
      }
      // if already has field but is undefined, normalize
      const migrated = migrateTransaksi(item);
      if (migrated) return migrated;
      // fallback: ensure field exists
      return { ...(r as object), jenis_layanan: (r.jenis_layanan ?? null) } as Transaksi;
    });
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
    const normalized = { ...t } as Transaksi;
    if (normalized.jenis_layanan === undefined) normalized.jenis_layanan = null;
    if (normalized.tipe === "pendapatan") {
      normalized.rp_per_km = calcRpPerKm(normalized.nominal, normalized.jarak_km);
      normalizeJenisLayanan(normalized);
    } else { normalized.jarak_km = null; normalized.rp_per_km = null; normalized.jenis_layanan = null; }
    all.push(normalized);
    writeRaw(all);
  },
  update(id: string, patch: Partial<Transaksi>) {
    const all = readRaw();
    const idx = all.findIndex((t) => t.id === id);
    if (idx !== -1) {
      const next = { ...all[idx], ...patch } as Transaksi;
      if (next.jenis_layanan === undefined) next.jenis_layanan = null;
      // enforce invariant: recompute rp_per_km, don't trust caller
      if (next.tipe === "pendapatan") {
        next.rp_per_km = calcRpPerKm(next.nominal, next.jarak_km);
        normalizeJenisLayanan(next);
      } else { next.jarak_km = null; next.rp_per_km = null; next.jenis_layanan = null; }
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
      // reject prototype pollution keys (check own property, not prototype)
      if (item && typeof item === "object" && (Object.prototype.hasOwnProperty.call(item as object, "__proto__") || Object.prototype.hasOwnProperty.call(item as object, "constructor"))) {
        skip++;
        continue;
      }
      const parsed = TransaksiSchema.safeParse(item);
      if (!parsed.success) {
        skip++;
        continue;
      }
      const t = parsed.data as Transaksi;
      // recompute invariant (don't trust imported rp_per_km) + normalize jenis_layanan for legacy
      if (t.tipe === "pendapatan") {
        t.rp_per_km = calcRpPerKm(t.nominal, t.jarak_km);
        // For import, keep legacy null for Shopee missing, but normalize invalid cross-platform already filtered by superRefine
        // Also normalize Lainnya/null platform
        if (t.platform === "Lainnya" || t.platform == null) t.jenis_layanan = null;
        if (t.platform === "Grab" && t.jenis_layanan === null) {
          // This case should have been rejected by superRefine (skip), but if somehow passed, keep null
        }
      } else { t.jarak_km = null; t.rp_per_km = null; t.jenis_layanan = null; }
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
