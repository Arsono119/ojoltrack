"use client";
import { useEffect, useState, useCallback } from "react";
import { storage } from "@/lib/storage";
import type { Transaksi } from "@/lib/types";

export function useTransaksi() {
  const [data, setData] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setData(storage.getAll());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = () => refresh();
    window.addEventListener("storage", onStorage);
    // poll for same-tab updates
    const id = setInterval(refresh, 800);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(id);
    };
  }, [refresh]);

  const add = useCallback((t: Transaksi) => {
    storage.add(t);
    refresh();
  }, [refresh]);

  const remove = useCallback((id: string) => {
    storage.remove(id);
    refresh();
  }, [refresh]);

  return { data, loading, refresh, add, remove };
}
