import type { Transaksi } from "./types";

const KEY = "ojoltrack_transaksi";

function readRaw(): Transaksi[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(data: Transaksi[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(data));
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
    const all = readRaw();
    all.push(t);
    writeRaw(all);
  },
  update(id: string, patch: Partial<Transaksi>) {
    const all = readRaw();
    const idx = all.findIndex((t) => t.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...patch } as Transaksi;
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
      const t = item as Transaksi;
      if (!t.id || !t.tanggal || !t.nominal) {
        skip++;
        continue;
      }
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
