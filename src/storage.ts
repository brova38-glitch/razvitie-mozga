import { useEffect, useState } from "react";

const P = "rm:";
function read<T>(k: string, d: T): T {
  try { const v = localStorage.getItem(P + k); return v === null ? d : (JSON.parse(v) as T); } catch { return d; }
}
function write<T>(k: string, v: T) {
  try { localStorage.setItem(P + k, JSON.stringify(v)); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent("rm-store", { detail: k }));
}

export function usePersist<T>(k: string, d: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(() => read(k, d));
  useEffect(() => {
    const on = (e: Event) => { if ((e as CustomEvent).detail === k) setV(read(k, d)); };
    window.addEventListener("rm-store", on);
    return () => window.removeEventListener("rm-store", on);
  }, [k]);
  return [v, (nv: T) => { setV(nv); write(k, nv); }];
}

const day = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

type Streak = { last: string; count: number; total: number };
export function markPractice() {
  const s = read<Streak>("streak", { last: "", count: 0, total: 0 });
  const today = day(new Date());
  if (s.last === today) return;
  const y = new Date(); y.setDate(y.getDate() - 1);
  write<Streak>("streak", { last: today, count: s.last === day(y) ? s.count + 1 : 1, total: s.total + 1 });
}
export function useStreak(): number {
  const [s] = usePersist<Streak>("streak", { last: "", count: 0, total: 0 });
  const y = new Date(); y.setDate(y.getDate() - 1);
  return s.last === day(new Date()) || s.last === day(y) ? s.count : 0;
}
