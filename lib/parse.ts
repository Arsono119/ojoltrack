export function parseRupiah(input: string): number {
  if (!input) return 0;
  const digits = input.replace(/[^0-9]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

export function formatRupiahShort(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}

export function parseJarak(input: string): number | null {
  if (!input) return null;
  const normalized = input.replace(",", ".").replace(/[^0-9.]/g, "");
  const v = parseFloat(normalized);
  return isNaN(v) || v <= 0 ? null : v;
}

export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

