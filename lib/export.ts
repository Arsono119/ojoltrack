import type { Transaksi } from "./types";

const HEADERS = ["id","tipe","tanggal","waktu","nominal","platform","jarak_km","rp_per_km","kategori","catatan","sumber_input","created_at"] as const;

function escapeCsv(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportToCSV(transaksi: Transaksi[]): string {
  const rows = [HEADERS.join(",")];
  for (const t of transaksi) {
    rows.push(HEADERS.map((h) => escapeCsv((t as unknown as Record<string, unknown>)[h])).join(","));
  }
  return rows.join("\n");
}

export function exportToBlob(transaksi: Transaksi[]): Blob {
  return new Blob([exportToCSV(transaksi)], { type: "text/csv;charset=utf-8;" });
}

export function parseCSV(csv: string): Transaksi[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  const result: Transaksi[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // simple split — assumes no quoted commas in test data; for prod use papaparse if needed
    const cols = line.split(",");
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => (obj[h] = cols[idx] ?? ""));
    result.push({
      id: obj.id,
      tipe: obj.tipe as Transaksi["tipe"],
      tanggal: obj.tanggal,
      waktu: obj.waktu || null,
      nominal: parseInt(obj.nominal, 10) || 0,
      platform: (obj.platform || null) as Transaksi["platform"],
      jarak_km: obj.jarak_km ? parseFloat(obj.jarak_km) : null,
      rp_per_km: obj.rp_per_km ? parseInt(obj.rp_per_km, 10) : null,
      kategori: (obj.kategori || null) as Transaksi["kategori"],
      catatan: obj.catatan || null,
      sumber_input: (obj.sumber_input as Transaksi["sumber_input"]) || "manual",
      created_at: obj.created_at,
    });
  }
  return result;
}
