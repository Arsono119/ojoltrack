import type { Kategori } from "./types";

const map: Record<string, Kategori> = {
  bensin: "bensin",
  pertamax: "bensin",
  pertalite: "bensin",
  shell: "bensin",
  premium: "bensin",
  pom: "bensin",
  makan: "makan",
  warteg: "makan",
  ayam: "makan",
  nasi: "makan",
  minum: "makan",
  warung: "makan",
  resto: "makan",
  servis: "servis",
  oli: "servis",
  bengkel: "servis",
  ban: "servis",
  service: "servis",
  sparepart: "servis",
};

export function categorize(catatan: string | null | undefined): Kategori {
  if (!catatan) return "lainnya";
  const lower = catatan.toLowerCase();
  for (const [kw, cat] of Object.entries(map)) {
    if (lower.includes(kw)) return cat;
  }
  return "lainnya";
}
