import type { Transaksi } from "../types";
import { calcRpPerKm } from "../calc";
import type { SupabaseClient } from "@supabase/supabase-js";

const TABLE = "transaksi";

function toRow(t: Transaksi, user_id: string) {
  const row = { ...t, user_id, updated_at: new Date().toISOString(), deleted_at: null as string | null };
  // enforce invariant
  if (row.tipe === "pendapatan") row.rp_per_km = calcRpPerKm(row.nominal, row.jarak_km);
  else { row.jarak_km = null; row.rp_per_km = null; }
  return row;
}

export class SupabaseRepo {
  constructor(private supabase: SupabaseClient, private userId: string) {}

  async getAll(): Promise<Transaksi[]> {
    const { data, error } = await this.supabase.from(TABLE).select("*").eq("user_id", this.userId).is("deleted_at", null).order("tanggal", { ascending: false });
    if (error) throw error;
    return (data as Transaksi[]) ?? [];
  }

  async getByTanggal(tanggal: string): Promise<Transaksi[]> {
    const { data, error } = await this.supabase.from(TABLE).select("*").eq("user_id", this.userId).eq("tanggal", tanggal).is("deleted_at", null);
    if (error) throw error;
    return (data as Transaksi[]) ?? [];
  }

  async add(t: Transaksi): Promise<void> {
    const row = toRow(t, this.userId);
    const { error } = await this.supabase.from(TABLE).upsert(row, { onConflict: "id" });
    if (error) throw error;
  }

  async update(id: string, patch: Partial<Transaksi>): Promise<void> {
    // fetch existing to compute invariant
    const { data } = await this.supabase.from(TABLE).select("*").eq("id", id).eq("user_id", this.userId).single();
    const next = { ...(data as Transaksi), ...patch } as Transaksi;
    if (next.tipe === "pendapatan") next.rp_per_km = calcRpPerKm(next.nominal, next.jarak_km);
    else { next.jarak_km = null; next.rp_per_km = null; }
    const row = toRow(next, this.userId);
    const { error } = await this.supabase.from(TABLE).update(row).eq("id", id).eq("user_id", this.userId);
    if (error) throw error;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.from(TABLE).update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("user_id", this.userId);
    if (error) throw error;
  }
}
