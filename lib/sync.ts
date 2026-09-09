// offline queue for pending sync when ENABLE_CLOUD_SYNC and online
const PENDING_KEY = "ojoltrack_pending_sync";
const LAST_SYNC_KEY = "ojoltrack_last_sync_at";

export type PendingOp = { op: "add" | "update" | "remove"; id: string; payload?: unknown; ts: string };

export function getPending(): PendingOp[] {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || "[]"); } catch { return []; }
}
export function pushPending(op: PendingOp) {
  const arr = getPending();
  arr.push(op);
  localStorage.setItem(PENDING_KEY, JSON.stringify(arr.slice(-100))); // cap 100
}
export function clearPending() { localStorage.removeItem(PENDING_KEY); }
export function setLastSyncNow() { try { localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString()); } catch {} }
