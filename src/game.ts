import { read, write, markPractice } from "./storage";
import type { Streak } from "./storage";

export const DAILY_GOAL = 50;
export const MAX_LEVEL = 50;
export const today = () => new Date().toDateString();
export const xpFor = (lvl: number) => 25 * (lvl - 1) * lvl; // XP needed to reach level
export function levelOf(xp: number) { let l = 1; while (l < MAX_LEVEL && xp >= xpFor(l + 1)) l++; return l; }

// ---- per-exercise session counters (filled by Msg / Btn) ----
export const session = { good: 0, bad: 0, presses: 0 };
export function resetSession() { session.good = 0; session.bad = 0; session.presses = 0; }

export function reportMax(key: string, v: number) {
  const m = read<Record<string, number>>("maxes", {});
  if (!(m[key] >= v)) { m[key] = v; write("maxes", m); }
}

export type Ach = { id: string; icon: string; name: string; desc: string; test: (s: Snap) => boolean };
export type Snap = { xp: number; level: number; streak: number; poems: number; sessions: number; best: Record<string, number>; maxes: Record<string, number>; planFull: boolean; goalDays: number; stars3: number };

export const ACHS: Ach[] = [
  { id: "first", icon: "🎉", name: "Первый шаг", desc: "Завершить первое упражнение", test: (s) => s.sessions >= 1 },
  { id: "ten", icon: "💪", name: "Разминка", desc: "10 завершённых упражнений", test: (s) => s.sessions >= 10 },
  { id: "fifty", icon: "🏋️", name: "Марафон", desc: "50 завершённых упражнений", test: (s) => s.sessions >= 50 },
  { id: "poem1", icon: "📜", name: "Первый стих", desc: "Выучить первое стихотворение", test: (s) => s.poems >= 1 },
  { id: "poem5", icon: "🎭", name: "Чтец", desc: "Выучить 5 стихотворений", test: (s) => s.poems >= 5 },
  { id: "poem10", icon: "👑", name: "Поэтическая память", desc: "Выучить все 10 стихов", test: (s) => s.poems >= 10 },
  { id: "streak3", icon: "🔥", name: "Огонёк", desc: "3 дня подряд", test: (s) => s.streak >= 3 },
  { id: "streak7", icon: "🌋", name: "Неделя огня", desc: "7 дней подряд", test: (s) => s.streak >= 7 },
  { id: "streak30", icon: "☄️", name: "Месяц без пропусков", desc: "30 дней подряд", test: (s) => s.streak >= 30 },
  { id: "schulte30", icon: "🔢", name: "Зоркий глаз", desc: "Таблица Шульте быстрее 30 с", test: (s) => (s.best.Schulte || 0) > 0 && s.best.Schulte < 30 },
  { id: "nback3", icon: "🧠", name: "Рабочая память", desc: "N-назад: уровень 3 с точностью от 80%", test: (s) => (s.maxes.nback || 0) >= 3 },
  { id: "wpm500", icon: "⚡", name: "Скорочтец", desc: "Быстрый показ: 500 слов/мин", test: (s) => (s.maxes.wpm || 0) >= 500 },
  { id: "num9", icon: "🔟", name: "Числовая память", desc: "Запомнить число из 9 цифр", test: (s) => (s.best.NumberGame || 0) >= 9 },
  { id: "plan", icon: "✅", name: "Все задания дня", desc: "Выполнить весь план за день", test: (s) => s.planFull },
  { id: "goal", icon: "🎯", name: "Цель дня", desc: "Набрать 50 XP за день", test: (s) => s.goalDays >= 1 },
  { id: "stars", icon: "⭐", name: "Отличник", desc: "10 уроков на 3 звезды", test: (s) => s.stars3 >= 10 },
  { id: "lvl5", icon: "🥉", name: "Уровень 5", desc: "Достичь 5-го уровня", test: (s) => s.level >= 5 },
  { id: "lvl10", icon: "🥈", name: "Уровень 10", desc: "Достичь 10-го уровня", test: (s) => s.level >= 10 },
  { id: "lvl25", icon: "🥇", name: "Уровень 25", desc: "Достичь 25-го уровня", test: (s) => s.level >= 25 },
];

const BEST_KEYS = ["Schulte", "NumberGame", "Simon", "WordsGame", "MathGame"];
export function snap(planLen: number): Snap {
  const xp = read<number>("xp", 0);
  const st = read<Streak>("streak", { last: "", count: 0, total: 0 });
  const y = new Date(); y.setDate(y.getDate() - 1);
  const dk = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const streak = st.last === dk(new Date()) || st.last === dk(y) ? st.count : 0;
  const best: Record<string, number> = {};
  BEST_KEYS.forEach((k) => { best[k] = read<number>("best:" + k, 0); });
  const stars = read<Record<string, number>>("stars", {});
  return {
    xp, level: levelOf(xp), streak, poems: read<string[]>("poems", []).length, sessions: read<number>("sessions", 0), best,
    maxes: read<Record<string, number>>("maxes", {}), planFull: read<number[]>("plan:" + today(), []).length >= planLen,
    goalDays: read<number>("goalDays", 0), stars3: Object.values(stars).filter((v) => v >= 3).length,
  };
}
export function checkAchs(planLen: number): Ach[] {
  const have = read<string[]>("ach", []);
  const s = snap(planLen);
  const fresh = ACHS.filter((a) => !have.includes(a.id) && a.test(s));
  if (fresh.length) write("ach", have.concat(fresh.map((a) => a.id)));
  return fresh;
}

export type Result = { id: string; xp: number; acc: number | null; stars: number; achs: Ach[]; levelUp: number | null; goalNow: boolean };

export function complete(id: string, planLen: number, planIdx: number[]): Result {
  const hadAnswers = session.good + session.bad;
  const acc = hadAnswers ? session.good / hadAnswers : null;
  const stars = acc === null ? 2 : acc >= 0.9 ? 3 : acc >= 0.6 ? 2 : 1;
  const xp = 10 + stars * 5 + Math.min(10, Math.floor(session.presses / 3));
  const before = read<number>("xp", 0);
  write("xp", before + xp);
  const dk = "xpday:" + today();
  const dayBefore = read<number>(dk, 0);
  write(dk, dayBefore + xp);
  const goalNow = dayBefore < DAILY_GOAL && dayBefore + xp >= DAILY_GOAL;
  if (goalNow) write("goalDays", read<number>("goalDays", 0) + 1);
  const st = read<Record<string, number>>("stars", {});
  if (!(st[id] >= stars)) { st[id] = stars; write("stars", st); }
  write("sessions", read<number>("sessions", 0) + 1);
  const pk = "plan:" + today();
  const done = read<number[]>(pk, []);
  const nd = done.concat(planIdx.filter((i) => !done.includes(i)));
  if (nd.length !== done.length) write(pk, nd);
  markPractice();
  const lb = levelOf(before), la = levelOf(before + xp);
  const achs = checkAchs(planLen);
  resetSession();
  return { id, xp, acc, stars, achs, levelUp: la > lb ? la : null, goalNow };
}

// one-time migration from the pre-game version
export function migrate() {
  if (read<boolean>("migrated2", false)) return;
  const st = read<Record<string, number>>("stars", {});
  const map: Record<string, string> = { Schulte: "schulte", NumberGame: "number", Simon: "simon", WordsGame: "words", MathGame: "math" };
  let bonus = 0;
  Object.keys(map).forEach((k) => { if (read<number>("best:" + k, 0) > 0 && !st[map[k]]) { st[map[k]] = 1; bonus += 15; } });
  const poems = read<string[]>("poems", []);
  bonus += poems.length * 30;
  write("stars", st);
  if (bonus) write("xp", read<number>("xp", 0) + bonus);
  write("migrated2", true);
}
