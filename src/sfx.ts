import { read } from "./storage";

let ctx: AudioContext | null = null;
const ac = () => {
  if (!ctx) { const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; if (!C) return null; ctx = new C(); }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
};
function tone(f: number, at: number, dur: number, vol = 0.12, type: OscillatorType = "sine") {
  const c = ac(); if (!c) return;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.value = f;
  const t0 = c.currentTime + at;
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.02);
}
export type Sfx = "tap" | "good" | "bad" | "win" | "level" | "xp";
export function play(s: Sfx) {
  if (read<boolean>("mute", false)) return;
  try {
    if (s === "tap") tone(520, 0, 0.06, 0.05, "triangle");
    if (s === "good") { tone(660, 0, 0.12); tone(990, 0.09, 0.18); }
    if (s === "bad") { tone(220, 0, 0.18, 0.1, "square"); tone(180, 0.1, 0.2, 0.08, "square"); }
    if (s === "xp") [880, 1175, 1568].forEach((f, i) => tone(f, i * 0.06, 0.12, 0.08));
    if (s === "win") [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.25, 0.11, "triangle"));
    if (s === "level") [523, 659, 784, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.11, 0.3, 0.11, "triangle"));
  } catch { /* ignore */ }
}
export function buzz(p: number | number[]) {
  try { if ("vibrate" in navigator) navigator.vibrate(p); } catch { /* ignore */ }
}
