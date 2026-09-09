"use client";
/* eslint-disable react-hooks/set-state-in-effect -- intentional hydration */
import { useEffect, useState, useCallback } from "react";
import { storage as localStorageRepo } from "@/lib/storage";
import type { Transaksi } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { SupabaseRepo } from "@/lib/supabase/repo";
import { ENABLE_CLOUD_SYNC } from "@/lib/config";

export function useTransaksi() {
  const [data, setData] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const getRepo = useCallback(async () => {
    if (!ENABLE_CLOUD_SYNC || process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) return { repo: localStorageRepo as unknown as { getAll(): Transaksi[]; add(t: Transaksi): void; remove(id: string): void }, userId: null };
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) return { repo: new SupabaseRepo(supabase as never, user.id), userId: user.id };
    } catch {}
    return { repo: localStorageRepo as unknown as { getAll(): Transaksi[]; add(t: Transaksi): void; remove(id: string): void }, userId: null };
  }, []);

  const refresh = useCallback(async () => {
    const { repo, userId: uid } = await getRepo();
    setUserId(uid);
    try {
      const all = await (repo as unknown as { getAll(): Promise<Transaksi[]> | Transaksi[] }).getAll();
      const list = Array.isArray(all) ? await Promise.resolve(all) : [];
      // filter deleted_at if Supabase includes soft deletes
      const filtered = list.filter((t) => !(t as unknown as { deleted_at?: string }).deleted_at);
      setData(filtered as Transaksi[]);
    } catch {
      setData(localStorageRepo.getAll());
    }
    setLoading(false);
  }, [getRepo]);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("storage", handler);
    window.addEventListener("ojoltrack:change", handler);
    // also listen auth change
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange(() => refresh());
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("ojoltrack:change", handler);
      sub.subscription.unsubscribe();
    };
  }, [refresh]);

  const add = useCallback(async (t: Transaksi) => {
    const { repo } = await getRepo();
    // always add to local cache for offline
    try { localStorageRepo.add(t); } catch {}
    try { await (repo as unknown as { add(t: Transaksi): Promise<void> }).add(t); } catch {}
    refresh();
    // migrate check: if first sync with cloud, push pending locals
    try { await migrateIfNeeded(); } catch {}
  }, [getRepo, refresh]);

  const remove = useCallback(async (id: string) => {
    const { repo } = await getRepo();
    try { localStorageRepo.remove(id); } catch {}
    try { await (repo as unknown as { remove(id: string): Promise<void> }).remove(id); } catch {}
    refresh();
  }, [getRepo, refresh]);

  return { data, loading, refresh, add, remove, userId };
}

async function migrateIfNeeded() {
  if (typeof window === "undefined") return;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) return;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const key = `ojoltrack_migrated_${user.id}`;
  if (localStorage.getItem(key)) return;
  const locals = localStorageRepo.getAll();
  if (locals.length === 0) { localStorage.setItem(key, "1"); return; }
  const repo = new SupabaseRepo(supabase as never, user.id);
  for (const t of locals) {
    try { await repo.add(t); } catch {}
  }
  localStorage.setItem(key, "1");
}
