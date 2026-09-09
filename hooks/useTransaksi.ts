"use client";
/* eslint-disable react-hooks/set-state-in-effect -- intentional hydration from localStorage */
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
    const handler = () => refresh();
    window.addEventListener("storage", handler);
    window.addEventListener("ojoltrack:change", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("ojoltrack:change", handler);
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
