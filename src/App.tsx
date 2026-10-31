import { createPortal } from "react-dom";
import { useState, useEffect, useRef, useMemo } from "react";
import type { KeyboardEvent, ChangeEvent, CSSProperties, ReactNode } from "react";
import { useGrokTheme } from "./theme";
import { usePersist, useStreak, read } from "./storage";
import { PAL } from "./theme";
import { play, buzz } from "./sfx";
import { session, resetSession, reportMax, complete, migrate, checkAchs, levelOf, xpFor, today, DAILY_GOAL, MAX_LEVEL, ACHS } from "./game";
import type { Result, Ach } from "./game";

// ================= data =================
const EMOJI = ["🍎", "🐱", "🌻", "🚗", "⭐", "🎈", "🐟", "🍀", "🎵", "🌙", "🍓", "🦋", "⚽", "🔑", "🎁", "🐝", "🍩", "☂️", "🐢", "🌈", "🔔", "🍉", "🦊", "🚀"];
const WORDS = ["дом", "кошка", "река", "окно", "яблоко", "книга", "солнце", "ключ", "лампа", "море", "хлеб", "часы", "дерево", "письмо", "гора", "зонт", "стол", "птица", "молоко", "мост", "звезда", "чашка", "лес", "поезд", "цветок", "снег", "шарф", "облако", "ручка", "сыр", "дверь", "лимон", "песок", "собака", "ветер", "свеча"];

type Q = { q: string; o: string[]; a: number };
type Txt = { title: string; body: string; qs: Q[] };
const TEXTS: Txt[] = [
  {
    title: "Как мозг запоминает",
    body: "Мозг человека весит около полутора килограммов, но расходует примерно пятую часть всей энергии тела. В нём около восьмидесяти шести миллиардов нейронов, и каждый связан с тысячами других. Когда мы что-то узнаём, связи между нужными нейронами становятся прочнее. Учёные описывают это простой фразой: нейроны, которые срабатывают вместе, связываются вместе. Особую роль играет гиппокамп — небольшая структура в глубине мозга, похожая на морского конька. Именно он помогает превращать свежие впечатления в долговременные воспоминания. Большая часть этой работы происходит во сне: ночью мозг словно перематывает события дня и закрепляет важное. Поэтому после бессонной ночи запоминать новое заметно труднее. Ещё один секрет памяти — вспоминание. Каждый раз, когда мы достаём знание из памяти, след становится сильнее, чем при простом перечитывании. Если повторять с перерывами, через день, через три дня и через неделю, знание держится намного дольше.",
    qs: [
      { q: "Какую часть энергии тела расходует мозг?", o: ["Около десятой", "Примерно пятую", "Половину"], a: 1 },
      { q: "На что похож гиппокамп?", o: ["На морского конька", "На грецкий орех", "На улитку"], a: 0 },
      { q: "Что укрепляет память сильнее перечитывания?", o: ["Громкая музыка", "Вспоминание", "Кофе"], a: 1 },
    ],
  },
  {
    title: "Деревья умеют общаться",
    body: "В лесу происходит больше, чем видно глазу. Корни деревьев переплетаются с тонкими нитями грибов, и вместе они образуют огромную подземную сеть. Учёные в шутку называют её лесным интернетом. По этой сети деревья обмениваются водой, сахарами и даже сигналами тревоги. Если на одно дерево нападают насекомые, соседи могут заранее начать вырабатывать горькие вещества, которые отпугивают вредителей. Старые большие деревья иногда делятся питанием с молодыми ростками, которые растут в тени и сами не получают достаточно света. Грибы при этом тоже не остаются внакладе: они получают от деревьев сахар, который те производят из солнечного света. Такая дружба длится сотни миллионов лет. Одна грибная сеть может тянуться на много километров и соединять тысячи деревьев. Поэтому лес — это не просто множество отдельных деревьев, а живое сообщество, где все связаны друг с другом.",
    qs: [
      { q: "Как называют подземную сеть в шутку?", o: ["Лесной телефон", "Лесной интернет", "Корневая почта"], a: 1 },
      { q: "Что получают грибы от деревьев?", o: ["Сахар", "Соль", "Камни"], a: 0 },
      { q: "Кому старые деревья помогают питанием?", o: ["Птицам", "Молодым росткам в тени", "Грибникам"], a: 1 },
    ],
  },
  {
    title: "Тишина космоса",
    body: "В космосе царит полная тишина. Звук — это колебания воздуха или другой среды, а в открытом космосе воздуха почти нет, поэтому звуку не по чему распространяться. Даже огромный взрыв звезды прошёл бы для нас совершенно беззвучно. Космонавты на станции общаются по радио, ведь радиоволнам воздух не нужен. Зато внутри станции довольно шумно: постоянно гудят вентиляторы и насосы, которые гоняют воздух и охлаждают приборы. Без них углекислый газ скапливался бы вокруг головы спящего человека, потому что в невесомости тёплый воздух не поднимается вверх. Интересно, что в невесомости меняется и тело. Позвоночник немного растягивается, и за полгода полёта космонавт может стать выше на несколько сантиметров. Вернувшись на Землю, он постепенно возвращается к прежнему росту. А ещё на орбите солнце восходит и заходит около шестнадцати раз в сутки.",
    qs: [
      { q: "Почему в космосе тихо?", o: ["Там очень холодно", "Там почти нет воздуха", "Там темно"], a: 1 },
      { q: "Как меняется рост космонавта в полёте?", o: ["Становится выше", "Становится ниже", "Не меняется"], a: 0 },
      { q: "Сколько раз в сутки восходит солнце на орбите?", o: ["Один", "Около шестнадцати", "Около ста"], a: 1 },
    ],
  },
];

type Poem = { t: string; a: string; lines: string[] };
const POEMS: Poem[] = [
  { t: "Я помню чудное мгновенье…", a: "А. С. Пушкин", lines: ["Я помню чудное мгновенье:", "Передо мной явилась ты,", "Как мимолётное виденье,", "Как гений чистой красоты."] },
  { t: "У лукоморья дуб зелёный…", a: "А. С. Пушкин", lines: ["У лукоморья дуб зелёный;", "Златая цепь на дубе том:", "И днём и ночью кот учёный", "Всё ходит по цепи кругом;"] },
  { t: "Парус", a: "М. Ю. Лермонтов", lines: ["Белеет парус одинокий", "В тумане моря голубом!..", "Что ищет он в стране далёкой?", "Что кинул он в краю родном?..", "Играют волны — ветер свищет,", "И мачта гнётся и скрыпит…", "Увы! он счастия не ищет", "И не от счастия бежит!", "Под ним струя светлей лазури,", "Над ним луч солнца золотой…", "А он, мятежный, просит бури,", "Как будто в бурях есть покой!"] },
  { t: "Утёс", a: "М. Ю. Лермонтов", lines: ["Ночевала тучка золотая", "На груди утёса-великана,", "Утром в путь она умчалась рано,", "По лазури весело играя.", "Но остался влажный след в морщине", "Старого утёса. Одиноко", "Он стоит, задумался глубоко,", "И тихонько плачет он в пустыне."] },
  { t: "Весенняя гроза", a: "Ф. И. Тютчев", lines: ["Люблю грозу в начале мая,", "Когда весенний, первый гром,", "Как бы резвяся и играя,", "Грохочет в небе голубом."] },
  { t: "Умом Россию не понять…", a: "Ф. И. Тютчев", lines: ["Умом — Россию не понять,", "Аршином общим не измерить:", "У ней особенная стать —", "В Россию можно только верить."] },
  { t: "Я пришёл к тебе с приветом…", a: "А. А. Фет", lines: ["Я пришёл к тебе с приветом,", "Рассказать, что солнце встало,", "Что оно горячим светом", "По листам затрепетало;"] },
  { t: "Берёза", a: "С. А. Есенин", lines: ["Белая берёза", "Под моим окном", "Принакрылась снегом,", "Точно серебром.", "На пушистых ветках", "Снежною каймой", "Распустились кисти", "Белой бахромой."] },
  { t: "Чудная картина…", a: "А. А. Фет", lines: ["Чудная картина,", "Как ты мне родна:", "Белая равнина,", "Полная луна,", "Свет небес высоких,", "И блестящий снег,", "И саней далёких", "Одинокий бег."] },
  { t: "Зима", a: "И. З. Суриков", lines: ["Белый снег, пушистый", "В воздухе кружится", "И на землю тихо", "Падает, ложится."] },
];

function shuffle<T>(a: T[]): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const x = b[i]; b[i] = b[j]; b[j] = x; }
  return b;
}
const rnd = (n: number) => Math.floor(Math.random() * n);
const norm = (s: string) => s.trim().toLowerCase().replace(/ё/g, "е").replace(/[^а-яa-z0-9-]/g, "");

let fireConfetti: () => void = () => {};

const CSS = `
@keyframes mtPop { 0% { transform: scale(.85); opacity: 0 } 60% { transform: scale(1.06); opacity: 1 } 100% { transform: scale(1) } }
@keyframes mtShake { 0%,100% { transform: translateX(0) } 20%,60% { transform: translateX(-6px) } 40%,80% { transform: translateX(6px) } }
@keyframes mtFade { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@keyframes mtGlow { 0%,100% { opacity: .5; transform: scale(1) } 50% { opacity: .9; transform: scale(1.15) } }
@keyframes mtConf { 0% { transform: translateY(-10vh) rotate(0); opacity: 1 } 100% { transform: translateY(105vh) rotate(720deg); opacity: .2 } }
@keyframes mtShrink { from { width: 100% } to { width: 0% } }
.mt-pop { animation: mtPop .45s cubic-bezier(.2,.9,.3,1.2) both }
.mt-shake { animation: mtShake .4s ease both }
.mt-fade { animation: mtFade .45s ease both }
.mt-press { transition: transform .15s ease, box-shadow .2s ease, background .2s ease, opacity .2s ease, border-color .2s }
.mt-press:active { transform: scale(.95) }
.mt-plan { transition: transform .2s ease, background .2s ease }
.mt-plan:hover { transform: translateX(4px) }
.mt-plan:active { transform: scale(.97) }
.mt-go { transition: transform .2s ease }
.mt-plan:hover .mt-go { transform: translateX(4px) }
@keyframes mtFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
@keyframes mtBounce { 0% { transform: scale(1) } 30% { transform: scale(1.25) translateY(-3px) } 60% { transform: scale(.95) } 100% { transform: scale(1) } }
@keyframes mtWiggle { 0%,100% { transform: rotate(0) } 25% { transform: rotate(-12deg) } 75% { transform: rotate(12deg) } }
@keyframes mtSlide { from { opacity: 0; transform: translateX(24px) } to { opacity: 1; transform: none } }
@keyframes mtFly { 0% { opacity: 0; transform: translate(-50%, 20px) scale(.6) } 25% { opacity: 1; transform: translate(-50%, -10px) scale(1.15) } 100% { opacity: 0; transform: translate(-50%, -90px) scale(1) } }
@keyframes mtPulse { 0% { box-shadow: 0 7px 0 var(--e, rgba(0,0,0,.2)), 0 0 0 0 var(--c) } 70% { box-shadow: 0 7px 0 var(--e, rgba(0,0,0,.2)), 0 0 0 14px transparent } 100% { box-shadow: 0 7px 0 var(--e, rgba(0,0,0,.2)), 0 0 0 0 transparent } }
@keyframes mtBob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }
@keyframes mtJump { 0% { transform: scale(.4) translateY(30px); opacity: 0 } 50% { transform: scale(1.1) translateY(-14px); opacity: 1 } 70% { transform: scale(.95) } 100% { transform: scale(1) } }
@keyframes mtStar { 0% { transform: scale(0) rotate(-90deg) } 70% { transform: scale(1.35) rotate(10deg) } 100% { transform: scale(1) } }
@keyframes mtToast { 0% { opacity: 0; transform: translate(-50%, -14px) } 12%, 85% { opacity: 1; transform: translate(-50%, 0) } 100% { opacity: 0; transform: translate(-50%, -8px) } }
@keyframes mtLvl { 0% { transform: scale(0) rotate(-180deg) } 70% { transform: scale(1.15) rotate(10deg) } 100% { transform: scale(1) } }
@keyframes mtFadeIn { from { opacity: 0 } to { opacity: 1 } }
.mt-float { animation: mtFloat 3s ease-in-out infinite }
.mt-bounce { animation: mtBounce .45s ease both }
.mt-wiggle { animation: mtWiggle .5s ease 3 }
.mt-slide { animation: mtSlide .35s cubic-bezier(.2,.9,.3,1) both }
.mt-fly { animation: mtFly 1.6s .5s ease-out both }
.mt-bob { animation: mtBob 1.4s ease-in-out infinite }
.mt-jump { animation: mtJump .7s cubic-bezier(.2,.9,.3,1.2) both }
.mt-starpop { display: inline-block; animation: mtStar .5s cubic-bezier(.2,.9,.3,1.3) both }
.mt-toast { animation: mtToast 2.2s ease both }
.mt-levelbadge { animation: mtLvl .8s cubic-bezier(.2,.9,.3,1.2) both }
.mt-fadein { animation: mtFadeIn .3s ease both }
.mt-pulse { animation: mtPulse 1.6s ease-out infinite }
.mt-3d, .mt-node { transition: transform .08s ease, box-shadow .08s ease, filter .15s; -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none }
.mt-3d:active:not(:disabled) { transform: translateY(4px); box-shadow: none !important }
.mt-node:active { transform: translateY(7px); box-shadow: none !important }
.mt-3d:hover:not(:disabled), .mt-node:hover { filter: brightness(1.06) }
.mt-go { display: inline-block }
*, *::before, *::after { box-sizing: border-box }
#root > div { overflow-x: hidden; max-width: 100vw }
[style*="display: flex"] > *, [style*="display: grid"] > * { min-width: 0 }
input, textarea, select { max-width: 100%; min-width: 0 }
img, svg { max-width: 100% }
html, body { overflow-x: hidden; touch-action: manipulation; -webkit-text-size-adjust: 100%; overscroll-behavior-y: none }
button { -webkit-tap-highlight-color: transparent; touch-action: manipulation }
`;

// ================= ui =================
function useS() {
  const t = useGrokTheme();
  const c = t.dataviz.categorical;
  const shadow = `0 4px 0 ${t.border.subtle}`;
  const card: CSSProperties = { position: "relative", background: t.bg.elevated, border: `2px solid ${t.border.subtle}`, borderRadius: 22, padding: 20, boxShadow: shadow, display: "flex", flexDirection: "column", gap: 16, fontFamily: t.font.family, color: t.text.primary };
  const row: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" };
  const muted: CSSProperties = { color: t.text.secondary, fontSize: 15, lineHeight: "22px" };
  const input: CSSProperties = { width: "100%", boxSizing: "border-box", padding: "14px 16px", borderRadius: 16, border: `1px solid ${t.border.default}`, background: t.bg.base, color: t.text.primary, fontFamily: t.font.family, fontSize: 18, outline: "none" };
  const grad = `linear-gradient(135deg, ${PAL.green[0]}, ${PAL.blue[0]})`;
  return { t, c, shadow, card, row, muted, input, grad };
}

function Btn(p: { label: string; onClick: () => void; primary?: boolean; disabled?: boolean }) {
  const { t } = useS();
  const edge = p.primary ? PAL.green[1] : t.border.default;
  return (
    <button className="mt-3d" disabled={p.disabled} onClick={() => { buzz(8); play("tap"); p.onClick(); }} style={{ minHeight: 48, padding: "0 20px", borderRadius: 16, border: p.primary ? "none" : `2px solid ${edge}`, background: p.primary ? PAL.green[0] : t.bg.elevated, color: p.primary ? "#fff" : t.text.primary, boxShadow: `0 4px 0 ${edge}`, fontFamily: t.font.family, fontSize: 16, fontWeight: 800, cursor: p.disabled ? "default" : "pointer", opacity: p.disabled ? 0.5 : 1 }}>{p.label}</button>
  );
}

function Col(p: { children?: ReactNode }) {
  return <div className="mt-fade" style={{ display: "flex", flexDirection: "column", gap: 14 }}>{p.children}</div>;
}

function Stats(p: { items: [string, string | number][] }) {
  const { t } = useS();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {p.items.map(([k, v]: [string, string | number]) => (
        <div key={k} style={{ flex: "1 1 80px", padding: "10px 12px", borderRadius: 16, background: t.bg.subtle, border: `1px solid ${t.border.subtle}` }}>
          <div style={{ fontSize: 11, color: t.text.tertiary, textTransform: "uppercase", letterSpacing: 0.6 }}>{k}</div>
          <div key={String(v)} className="mt-pop" style={{ fontSize: 21, fontWeight: 600, color: t.text.primary, fontVariantNumeric: "tabular-nums" }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

function Prog(p: { value: number }) {
  const { t, grad } = useS();
  return (
    <div style={{ height: 8, borderRadius: 99, background: t.bg.subtle, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.max(0, Math.min(1, p.value)) * 100}%`, background: grad, borderRadius: 99, transition: "width .5s ease" }} />
    </div>
  );
}

function Msg(p: { good: boolean; children?: ReactNode }) {
  const { t } = useS();
  useEffect(() => { if (p.good) { session.good++; play("good"); buzz(15); } else { session.bad++; play("bad"); buzz([40, 30, 40]); } }, []);
  return <div className={p.good ? "mt-pop" : "mt-shake"} style={{ padding: "12px 16px", borderRadius: 16, background: p.good ? t.fill.successSubtle : t.fill.warningSubtle, color: p.good ? t.text.success : t.text.warning, fontWeight: 500, fontSize: 15, lineHeight: "21px" }}>{p.children}</div>;
}

function Hint(p: { children?: ReactNode }) {
  const { t } = useS();
  return <div style={{ textAlign: "center", fontSize: 16, fontWeight: 500, color: t.text.secondary }}>{p.children}</div>;
}

function Chips<T extends string | number>(p: { options: [T, string][]; value: T; onChange: (v: T) => void }) {
  const { t } = useS();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {p.options.map(([v, l]: [T, string]) => {
        const on = v === p.value;
        return <button key={String(v)} className="mt-press" onClick={() => p.onChange(v)} style={{ minHeight: 40, padding: "0 14px", borderRadius: 14, border: `2px solid ${on ? PAL.blue[0] : t.border.default}`, fontWeight: 800, background: on ? t.fill.accentSubtle : "transparent", color: on ? t.text.accent : t.text.secondary, fontFamily: t.font.family, fontSize: 14, cursor: "pointer" }}>{l}</button>;
      })}
    </div>
  );
}

function TextIn(p: { value: string; onChange: (v: string) => void; onEnter: () => void; placeholder?: string; numeric?: boolean; big?: boolean }) {
  const { t, input } = useS();
  return <input style={p.big ? { ...input, fontFamily: t.font.mono, fontSize: 26, letterSpacing: 4, textAlign: "center" } : input} inputMode={p.numeric ? "numeric" : "text"} autoFocus value={p.value} placeholder={p.placeholder}
    onChange={(e: ChangeEvent<HTMLInputElement>) => p.onChange(p.numeric ? e.target.value.replace(/[^\d-]/g, "") : e.target.value)}
    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") p.onEnter(); }} />;
}

function Confetti() {
  const { t, c } = useS();
  const [n, setN] = useState(0);
  useEffect(() => { fireConfetti = () => setN((x: number) => x + 1); }, []);
  const pieces = useMemo(() => Array.from({ length: 44 }).map((_: unknown, i: number) => ({ l: Math.random() * 100, d: Math.random() * 0.5, s: 1.6 + Math.random() * 1.4, w: 6 + rnd(6), col: [c[0], c[1], c[2], t.text.success][i % 4] })), [n]);
  if (!n) return null;
  return (
    <div key={n} style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 50 }}>
      {pieces.map((p: { l: number; d: number; s: number; w: number; col: string }, i: number) => (
        <span key={i} style={{ position: "absolute", top: 0, left: `${p.l}%`, width: p.w, height: p.w * 1.6, borderRadius: 2, background: p.col, animation: `mtConf ${p.s}s ${p.d}s ease-in both` }} />
      ))}
    </div>
  );
}

type Item = { id: string; icon: string; name: string; short: string };

function GameCard(p: { item: Item; desc: string; children?: ReactNode }) {
  const { t, card, grad } = useS();
  return (
    <div className="mt-fade" style={card}>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ width: 50, height: 50, flex: "0 0 50px", borderRadius: 16, background: grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 25 }}>{p.item.icon}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 21, fontWeight: 650, letterSpacing: -0.3 }}>{p.item.name}</div>
          <div style={{ fontSize: 14, color: t.text.secondary, lineHeight: "20px" }}>{p.desc}</div>
        </div>
      </div>
      {p.children}
    </div>
  );
}

// ================= Скорочтение =================
function Rsvp() {
  const { t, row, muted } = useS();
  const [ti, setTi] = useState(0);
  const [wpm, setWpm] = useState(250);
  const [chunk, setChunk] = useState(1);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const words = useMemo(() => TEXTS[ti].body.split(/\s+/), [ti]);
  const chunks = useMemo(() => { const r: string[][] = []; for (let i = 0; i < words.length; i += chunk) r.push(words.slice(i, i + chunk)); return r; }, [words, chunk]);
  useEffect(() => { setIdx(0); setPlaying(false); }, [ti, chunk]);
  useEffect(() => {
    if (!playing) return;
    if (idx >= chunks.length - 1) { setPlaying(false); fireConfetti(); reportMax("wpm", wpm); session.good++; return; }
    const cur = chunks[idx].join(" ");
    const pause = /[.!?]$/.test(cur) ? 1.8 : /[,;:—]$/.test(cur) ? 1.3 : 1;
    const id = setTimeout(() => setIdx(idx + 1), (60000 / wpm) * chunks[idx].length * pause);
    return () => clearTimeout(id);
  }, [playing, idx, wpm, chunks]);
  const cur = chunks[Math.min(idx, chunks.length - 1)] || [];
  let view: ReactNode = cur.join(" ");
  if (chunk === 1 && cur[0]) {
    const w = cur[0];
    const p = Math.min(w.length - 1, Math.max(0, Math.floor((w.length - 1) * 0.35)));
    view = <span>{w.slice(0, p)}<span style={{ color: t.text.danger }}>{w[p]}</span>{w.slice(p + 1)}</span>;
  }
  return (
    <Col>
      <Chips options={TEXTS.map((x: Txt, i: number) => [i, x.title] as [number, string])} value={ti} onChange={(v: number) => setTi(v)} />
      <div style={{ position: "relative", padding: "38px 10px", borderRadius: 20, background: t.bg.subtle, textAlign: "center", fontSize: "clamp(26px, 7vw, 40px)", fontWeight: 600, color: t.text.primary, minHeight: 50 }}>
        <div style={{ position: "absolute", left: "50%", top: 10, width: 2, height: 12, background: t.border.strong }} />
        <div key={idx} className="mt-fade" style={{ animationDuration: ".12s" }}>{view}</div>
        <div style={{ position: "absolute", left: "50%", bottom: 10, width: 2, height: 12, background: t.border.strong }} />
      </div>
      <Prog value={chunks.length ? idx / (chunks.length - 1) : 0} />
      <div>
        <div style={{ ...muted, display: "flex", justifyContent: "space-between" }}><span>Скорость</span><span style={{ color: t.text.primary, fontWeight: 600 }}>{wpm} слов/мин</span></div>
        <input type="range" min={100} max={700} step={25} value={wpm} onChange={(e: ChangeEvent<HTMLInputElement>) => setWpm(Number(e.target.value))} style={{ width: "100%", accentColor: t.dataviz.categorical[0] }} />
      </div>
      <Chips options={[[1, "1 слово"], [2, "2 слова"], [3, "3 слова"]]} value={chunk} onChange={(v: number) => setChunk(v)} />
      <div style={row}>
        <Btn primary label={playing ? "Пауза" : idx > 0 && idx < chunks.length - 1 ? "Продолжить" : "Старт"} onClick={() => { if (!playing && idx >= chunks.length - 1) setIdx(0); setPlaying(!playing); }} />
        <Btn label="Сначала" onClick={() => { setIdx(0); setPlaying(false); }} />
      </div>
      <div style={muted}>Смотри в центр, на красную букву. Начни с 200–250 слов/мин и прибавляй по 25, пока смысл понятен.</div>
    </Col>
  );
}

function Schulte() {
  const { t, row } = useS();
  const [grid, setGrid] = useState<number[]>(() => shuffle(Array.from({ length: 25 }).map((_: unknown, i: number) => i + 1)));
  const [next, setNext] = useState(1);
  const [start, setStart] = useState(0);
  const [now, setNow] = useState(0);
  const [bad, setBad] = useState(-1);
  const [best, setBest] = usePersist<number>("best:Schulte", 0);
  const done = next > 25;
  useEffect(() => { if (!start || done) return; const id = setInterval(() => setNow(Date.now()), 100); return () => clearInterval(id); }, [start, done]);
  const reset = () => { setGrid(shuffle(grid)); setNext(1); setStart(0); setNow(0); };
  const tap = (v: number, i: number) => {
    if (done) return;
    if (v === next) {
      const s = start || Date.now();
      if (!start) setStart(s);
      if (v === 25) { const tt = (Date.now() - s) / 1000; setNow(Date.now()); if (!best || tt < best) setBest(tt); fireConfetti(); }
      setNext(next + 1);
    } else { setBad(i); setTimeout(() => setBad(-1), 400); }
  };
  const secs = start ? ((now || Date.now()) - start) / 1000 : 0;
  return (
    <Col>
      <Stats items={[["Найди", done ? "✓" : next], ["Время", `${secs.toFixed(1)} с`], ["Рекорд", best ? `${best.toFixed(1)} с` : "—"]]} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 6, width: "100%", maxWidth: 380, margin: "0 auto", position: "relative" }}>
        {grid.map((v: number, i: number) => (
          <div key={v} className={`mt-press ${bad === i ? "mt-shake" : ""}`} onClick={() => tap(v, i)} style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, fontSize: 22, fontWeight: 600, cursor: "pointer", userSelect: "none", background: v < next ? t.fill.accentSubtle : bad === i ? t.fill.dangerSubtle : t.bg.base, color: v < next ? t.text.tertiary : t.text.primary, border: `1px solid ${t.border.subtle}` }}>{v}</div>
        ))}
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 8, height: 8, marginLeft: -4, marginTop: -4, borderRadius: 99, background: t.text.danger, pointerEvents: "none", opacity: 0.7 }} />
      </div>
      {done ? <Msg good>Готово за {secs.toFixed(1)} с! Хороший результат — меньше 40 секунд, отличный — меньше 25.</Msg> : <Hint>Смотри в центр и ищи числа от 1 до 25 боковым зрением</Hint>}
      <div style={row}><Btn primary={done} label="Новая таблица" onClick={reset} /></div>
    </Col>
  );
}

function Periph() {
  const { t, row } = useS();
  const [lvl, setLvl] = useState(1);
  const [phase, setPhase] = useState<"idle" | "flash" | "ask" | "res">("idle");
  const [pair, setPair] = useState<[number, number, number]>([0, 0, 0]);
  const [ans, setAns] = useState("");
  const [ok, setOk] = useState(false);
  const [score, setScore] = useState(0);
  const go = () => { setPair([rnd(10), rnd(10), rnd(10)]); setAns(""); setPhase("flash"); };
  useEffect(() => { if (phase !== "flash") return; const id = setTimeout(() => setPhase("ask"), Math.max(180, 420 - lvl * 30)); return () => clearTimeout(id); }, [phase]);
  const gap = 8 + lvl * 6;
  const check = () => { const g = ans === `${pair[0]}${pair[1]}${pair[2]}`; setOk(g); setPhase("res"); if (g) { setScore(score + 1); if (lvl < 7) setLvl(lvl + 1); else fireConfetti(); } };
  const dig = (v: number, left: string): ReactNode => <span style={{ position: "absolute", left, top: "50%", transform: "translate(-50%,-50%)", fontSize: 30, fontWeight: 700, color: t.text.primary }}>{v}</span>;
  return (
    <Col>
      <Stats items={[["Ширина", `${lvl}/7`], ["Верно", score]]} />
      <div style={{ position: "relative", height: 120, borderRadius: 20, background: t.bg.subtle, overflow: "hidden" }}>
        <span style={{ position: "absolute", left: "50%", top: "50%", width: 10, height: 10, margin: -5, borderRadius: 99, background: t.text.danger }} />
        {phase === "flash" ? <Fragment0>{dig(pair[0], `${50 - gap}%`)}{dig(pair[1], "50%")}{dig(pair[2], `${50 + gap}%`)}</Fragment0> : null}
      </div>
      {phase === "idle" ? <Hint>Смотри на красную точку. На миг появятся три цифры — запомни их все, не двигая глазами.</Hint> : null}
      {phase === "ask" ? <Col><TextIn big numeric value={ans} onChange={setAns} onEnter={check} placeholder="Три цифры" /><div style={row}><Btn primary label="Проверить" onClick={check} /></div></Col> : null}
      {phase === "res" ? <Msg good={ok}>{ok ? "Верно! Поле зрения расширяется." : `Было ${pair.join(" ")}. Попробуй ещё.`}</Msg> : null}
      {phase !== "ask" && phase !== "flash" ? <div style={row}><Btn primary label={phase === "idle" ? "Начать" : "Дальше"} onClick={go} />{lvl > 1 ? <Btn label="Уже" onClick={() => setLvl(lvl - 1)} /> : null}</div> : null}
    </Col>
  );
}

function Fragment0(p: { children?: ReactNode }) { return <>{p.children}</>; }

function ReadTest() {
  const { t, row, muted } = useS();
  const [ti, setTi] = useState(0);
  const [phase, setPhase] = useState<"idle" | "read" | "quiz" | "res">("idle");
  const [st, setSt] = useState(0);
  const [secs, setSecs] = useState(0);
  const [ans, setAns] = useState<number[]>([]);
  const tx = TEXTS[ti];
  const wc = tx.body.split(/\s+/).length;
  const wpm = secs ? Math.round(wc / (secs / 60)) : 0;
  const right = ans.filter((a: number, i: number) => a === tx.qs[i].a).length;
  const pick = (qi: number, oi: number) => {
    if (ans[qi] !== undefined) return;
    const a = ans.slice(); a[qi] = oi; setAns(a);
    if (a.filter((x: number | undefined) => x !== undefined).length === tx.qs.length) setTimeout(() => { setPhase("res"); if (a.every((x: number, i: number) => x === tx.qs[i].a)) fireConfetti(); }, 500);
  };
  return (
    <Col>
      <Chips options={TEXTS.map((x: Txt, i: number) => [i, x.title] as [number, string])} value={ti} onChange={(v: number) => { setTi(v); setPhase("idle"); }} />
      {phase === "idle" ? <Col><div style={muted}>Читай в обычном темпе, стараясь понять смысл. Потом ответь на {tx.qs.length} вопроса. Слов в тексте: {wc}.</div><div style={row}><Btn primary label="Начать чтение" onClick={() => { setSt(Date.now()); setAns([]); setPhase("read"); }} /></div></Col> : null}
      {phase === "read" ? (
        <Col>
          <div style={{ fontSize: 18, lineHeight: "29px", color: t.text.primary, padding: "4px 2px" }}>{tx.body}</div>
          <div style={row}><Btn primary label="Готово, прочитано" onClick={() => { setSecs((Date.now() - st) / 1000); setPhase("quiz"); }} /></div>
        </Col>
      ) : null}
      {phase === "quiz" ? (
        <Col>
          {tx.qs.map((q: Q, qi: number) => (
            <div key={qi} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{qi + 1}. {q.q}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {q.o.map((o: string, oi: number) => {
                  const chosen = ans[qi] === oi; const done = ans[qi] !== undefined;
                  const bg = done && oi === q.a ? t.fill.successSubtle : chosen ? t.fill.dangerSubtle : t.bg.subtle;
                  return <button key={oi} className={`mt-press ${chosen ? (oi === q.a ? "mt-pop" : "mt-shake") : ""}`} onClick={() => pick(qi, oi)} style={{ minHeight: 44, padding: "8px 14px", borderRadius: 14, border: `1px solid ${t.border.subtle}`, background: bg, color: t.text.primary, fontFamily: t.font.family, fontSize: 15, cursor: "pointer" }}>{o}</button>;
                })}
              </div>
            </div>
          ))}
        </Col>
      ) : null}
      {phase === "res" ? (
        <Col>
          <Stats items={[["Скорость", `${wpm} сл/мин`], ["Понимание", `${right}/${tx.qs.length}`], ["Время", `${Math.round(secs)} с`]]} />
          <Msg good={right === tx.qs.length}>{right === tx.qs.length ? "Быстро и с пониманием — отлично!" : "Скорость без понимания не считается. Попробуй чуть медленнее."} Средняя скорость взрослого — около 200–250 слов в минуту.</Msg>
          <div style={row}><Btn primary label="Другой текст" onClick={() => { setTi((ti + 1) % TEXTS.length); setPhase("idle"); }} /></div>
        </Col>
      ) : null}
    </Col>
  );
}

// ================= Память (classic) =================
const PAIR_LEVELS: [number, number][] = [[4, 3], [4, 4], [5, 4], [6, 4], [6, 5], [6, 6]];
function Pairs() {
  const { t, row, grad, shadow } = useS();
  const [level, setLevel] = useState(() => Math.min(PAIR_LEVELS.length - 1, Math.max(0, Number(new URLSearchParams(location.search).get("pairlvl")) || 0)));
  const [cards, setCards] = useState<string[]>([]);
  const [open, setOpen] = useState<number[]>([]);
  const [done, setDone] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [start, setStart] = useState(0);
  const [now, setNow] = useState(0);
  const [won, setWon] = useState(false);
  const cols = PAIR_LEVELS[level][0];
  const deal = (lv: number) => {
    const [c, r] = PAIR_LEVELS[lv];
    const pick = shuffle(EMOJI).slice(0, (c * r) / 2);
    setCards(shuffle(pick.concat(pick))); setOpen([]); setDone([]); setMoves(0); setWon(false); setStart(Date.now()); setNow(Date.now());
  };
  useEffect(() => { deal(level); }, [level]);
  useEffect(() => { if (won) return; const id = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(id); }, [won]);
  const click = (i: number) => {
    if (open.length === 2 || open.includes(i) || done.includes(i)) return;
    const o = open.concat(i); setOpen(o);
    if (o.length === 2) {
      setMoves(moves + 1);
      if (cards[o[0]] === cards[o[1]]) {
        const d = done.concat(o);
        setTimeout(() => { setDone(d); setOpen([]); if (d.length === cards.length) { setWon(true); setNow(Date.now()); fireConfetti(); } }, 350);
      } else setTimeout(() => setOpen([]), 850);
    }
  };
  const secs = Math.max(0, Math.round((now - start) / 1000));
  return (
    <Col>
      <Stats items={[["Уровень", `${level + 1}/${PAIR_LEVELS.length}`], ["Ходы", moves], ["Время", `${secs} с`]]} />
      <Prog value={cards.length ? done.length / cards.length : 0} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: cols >= 5 ? "clamp(4px, 1.5vw, 8px)" : 8, width: "100%", maxWidth: cols * 84, margin: "0 auto" }}>
        {cards.map((c: string, i: number) => {
          const shown = open.includes(i) || done.includes(i); const ok = done.includes(i);
          const face: CSSProperties = { position: "absolute", inset: 0, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" };
          return (
            <div key={i} onClick={() => click(i)} style={{ aspectRatio: "1", perspective: 600, cursor: "pointer" }}>
              <div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", transition: "transform .45s cubic-bezier(.3,.8,.3,1)", transform: shown ? "rotateY(180deg)" : "none" }}>
                <div style={{ ...face, background: grad, boxShadow: shadow, opacity: 0.92 }}><span style={{ fontSize: 18, color: t.text.onColor, opacity: 0.8 }}>✦</span></div>
                <div style={{ ...face, transform: "rotateY(180deg)", background: ok ? t.fill.successSubtle : t.bg.base, border: `2px solid ${ok ? t.text.success : t.border.default}`, fontSize: cols >= 5 ? "clamp(18px, 6vw, 28px)" : 30, borderRadius: cols >= 5 ? 12 : 16 }}><span className={ok ? "mt-pop" : ""}>{c}</span></div>
              </div>
            </div>
          );
        })}
      </div>
      {won ? <Msg good>Великолепно! Все пары найдены за {moves} ходов и {secs} с.</Msg> : null}
      <div style={row}>
        {won && level < PAIR_LEVELS.length - 1 ? <Btn primary label="Следующий уровень →" onClick={() => setLevel(level + 1)} /> : null}
        <Btn label="Заново" onClick={() => deal(level)} />
        {level > 0 ? <Btn label="Проще" onClick={() => setLevel(level - 1)} /> : null}
      </div>
    </Col>
  );
}

function NumberGame() {
  const { t, row, grad } = useS();
  const [len, setLen] = useState(3);
  const [best, setBest] = usePersist<number>("best:NumberGame", 0);
  const [num, setNum] = useState("");
  const [phase, setPhase] = useState<"idle" | "show" | "ask" | "result">("idle");
  const [answer, setAnswer] = useState("");
  const [ok, setOk] = useState(false);
  const go = (n: number) => { let s = String(1 + rnd(9)); for (let i = 1; i < n; i++) s += String(rnd(10)); setNum(s); setAnswer(""); setPhase("show"); };
  const showMs = 1500 + len * 500;
  useEffect(() => { if (phase !== "show") return; const id = setTimeout(() => setPhase("ask"), showMs); return () => clearTimeout(id); }, [phase, len]);
  const check = () => { const g = answer.trim() === num; setOk(g); setPhase("result"); if (g) { if (len + 1 > best && len >= 7) fireConfetti(); setBest(Math.max(best, len)); } };
  const next = () => { const n = ok ? len + 1 : len; setLen(n); go(n); };
  return (
    <Col>
      <Stats items={[["Цифр", len], ["Рекорд", best || "—"]]} />
      {phase === "idle" ? <div style={row}><Btn primary label="Начать" onClick={() => go(len)} /></div> : null}
      {phase === "show" ? (
        <Col>
          <div className="mt-pop" style={{ fontFamily: t.font.mono, fontSize: "clamp(28px, 9vw, 48px)", fontWeight: 600, letterSpacing: 6, textAlign: "center", padding: "24px 8px", borderRadius: 20, background: t.bg.subtle, wordBreak: "break-all", color: t.text.primary }}>{num}</div>
          <div style={{ height: 6, borderRadius: 99, background: t.bg.subtle, overflow: "hidden" }}><div key={num} style={{ height: "100%", background: grad, animation: `mtShrink ${showMs}ms linear both` }} /></div>
        </Col>
      ) : null}
      {phase === "ask" ? <Col><TextIn big numeric value={answer} onChange={setAnswer} onEnter={check} placeholder="Какое было число?" /><div style={row}><Btn primary label="Проверить" onClick={check} /></div></Col> : null}
      {phase === "result" ? (
        <Col>
          <Msg good={ok}>{ok ? "Верно! Следующее число будет на одну цифру длиннее." : `Почти! Было ${num}, введено ${answer || "—"}. Попробуем ещё раз.`}</Msg>
          <div style={row}><Btn primary label={ok ? "Дальше →" : "Ещё раз"} onClick={next} />{len > 3 ? <Btn label="Короче" onClick={() => { setLen(len - 1); go(len - 1); }} /> : null}</div>
        </Col>
      ) : null}
    </Col>
  );
}

function Simon() {
  const { t, c, row } = useS();
  const colors = [c[0], c[1], c[2], t.dataviz.negative, t.dataviz.other, c[0], c[1], c[2], t.dataviz.negative];
  const icons = ["🔷", "⭐", "💧", "❤️", "🌙", "🍀", "🔥", "🎵", "💎"];
  const [size, setSize] = useState(4);
  const [seq, setSeq] = useState<number[]>([]);
  const [lit, setLit] = useState(-1);
  const [phase, setPhase] = useState<"idle" | "play" | "input" | "fail">("idle");
  const [pos, setPos] = useState(0);
  const [best, setBest] = usePersist<number>("best:Simon", 0);
  const timers = useRef<number[]>([]);
  const clear = () => { timers.current.forEach((x: number) => clearTimeout(x)); timers.current = []; };
  useEffect(() => clear, []);
  const play = (s: number[]) => {
    clear(); setPhase("play"); setPos(0);
    s.forEach((v: number, i: number) => {
      timers.current.push(window.setTimeout(() => setLit(v), 600 + i * 700));
      timers.current.push(window.setTimeout(() => setLit(-1), 600 + i * 700 + 450));
    });
    timers.current.push(window.setTimeout(() => setPhase("input"), 600 + s.length * 700));
  };
  const tap = (i: number) => {
    if (phase !== "input") return;
    setLit(i); timers.current.push(window.setTimeout(() => setLit(-1), 220));
    if (seq[pos] !== i) { setPhase("fail"); return; }
    if (pos + 1 === seq.length) {
      if (seq.length > best && seq.length % 5 === 0) fireConfetti();
      setBest(Math.max(best, seq.length));
      let sz = size;
      if (seq.length === 6 && size === 4) sz = 6;
      if (seq.length === 10 && size === 6) sz = 9;
      setSize(sz);
      const s = seq.concat(rnd(sz)); setSeq(s); setPhase("play");
      timers.current.push(window.setTimeout(() => play(s), 500));
    } else setPos(pos + 1);
  };
  const cols = size === 4 ? 2 : 3;
  const status = phase === "play" ? "Смотри внимательно…" : phase === "input" ? `Твой ход: ${pos + 1} из ${seq.length}` : phase === "idle" ? "Нажми «Начать»" : "";
  return (
    <Col>
      <Stats items={[["Длина", seq.length || "—"], ["Рекорд", best || "—"]]} />
      {status ? <Hint>{status}</Hint> : null}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: "clamp(6px, 3vw, 12px)", width: "100%", maxWidth: cols * 120, margin: "0 auto" }}>
        {Array.from({ length: size }).map((_: unknown, i: number) => {
          const on = lit === i;
          return <div key={i} onClick={() => tap(i)} style={{ aspectRatio: "1", borderRadius: 24, background: colors[i], opacity: on ? 1 : 0.28, transform: on ? "scale(1.06)" : "scale(1)", boxShadow: on ? `0 0 0 3px ${t.bg.elevated}, 0 0 32px 6px ${colors[i]}` : "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, cursor: phase === "input" ? "pointer" : "default", transition: "all .18s ease" }}>{icons[i]}</div>;
        })}
      </div>
      {phase === "fail" ? <Msg good={false}>Ошибка на длине {seq.length}. Ничего страшного — так память и растёт!</Msg> : null}
      <div style={row}>
        {phase === "idle" || phase === "fail" ? <Btn primary label="Начать" onClick={() => { setSize(4); const s = [rnd(4)]; setSeq(s); play(s); }} /> : null}
        {phase === "fail" ? <Btn label="Повторить эту длину" onClick={() => play(seq)} /> : null}
      </div>
    </Col>
  );
}

function WordsGame() {
  const { t, row, grad } = useS();
  const [count, setCount] = useState(5);
  const [list, setList] = useState<string[]>([]);
  const [phase, setPhase] = useState<"idle" | "show" | "ask" | "result">("idle");
  const [typed, setTyped] = useState<string[]>([]);
  const [cur, setCur] = useState("");
  const [left, setLeft] = useState(0);
  const [total, setTotal] = useState(1);
  const [best, setBest] = usePersist<number>("best:WordsGame", 0);
  const go = (n: number) => { setList(shuffle(WORDS).slice(0, n)); setTyped([]); setCur(""); setLeft(4 + n * 2); setTotal(4 + n * 2); setPhase("show"); };
  useEffect(() => { if (phase !== "show") return; if (left <= 0) { setPhase("ask"); return; } const id = setTimeout(() => setLeft(left - 1), 1000); return () => clearTimeout(id); }, [phase, left]);
  const add = () => { const w = norm(cur); if (w && !typed.includes(w)) setTyped(typed.concat(w)); setCur(""); };
  const hits = list.filter((w: string) => typed.includes(norm(w)));
  const good = hits.length >= Math.ceil(list.length * 0.8);
  const finish = () => { setBest(Math.max(best, hits.length)); setPhase("result"); if (hits.length === list.length) fireConfetti(); };
  const chip = (txt: string, state: "plain" | "good" | "miss", i: number) => (
    <span key={txt} className="mt-pop" style={{ animationDelay: `${i * 60}ms`, padding: "10px 16px", borderRadius: 999, fontSize: 18, fontWeight: 500, background: state === "good" ? t.fill.successSubtle : t.bg.subtle, color: state === "good" ? t.text.success : state === "miss" ? t.text.tertiary : t.text.primary, border: `1px solid ${state === "good" ? t.text.success : t.border.subtle}` }}>{txt}</span>
  );
  return (
    <Col>
      <Stats items={[["Слов", count], ["Рекорд", best || "—"]]} />
      {phase === "idle" ? <div style={row}><Btn primary label="Начать" onClick={() => go(count)} /></div> : null}
      {phase === "show" ? (
        <Col>
          <div style={{ display: "flex", justifyContent: "space-between", color: t.text.secondary, fontSize: 15 }}><span>Запоминай! Свяжи слова в историю.</span><span>{left} с</span></div>
          <div style={{ height: 6, borderRadius: 99, background: t.bg.subtle, overflow: "hidden" }}><div style={{ height: "100%", width: `${(left / total) * 100}%`, background: grad, transition: "width 1s linear" }} /></div>
          <div style={row}>{list.map((w: string, i: number) => chip(w, "plain", i))}</div>
          <div style={row}><Btn label="Запомнено ✓" onClick={() => setPhase("ask")} /></div>
        </Col>
      ) : null}
      {phase === "ask" ? (
        <Col>
          <Hint>Вводи слова по одному и нажимай Enter</Hint>
          <TextIn value={cur} onChange={setCur} onEnter={add} placeholder="Слово…" />
          {typed.length ? <div style={row}>{typed.map((w: string, i: number) => chip(w, list.some((x: string) => norm(x) === w) ? "good" : "miss", i))}</div> : null}
          <div style={row}><Btn label="Добавить" onClick={add} /><Btn primary label="Готово" onClick={finish} /></div>
        </Col>
      ) : null}
      {phase === "result" ? (
        <Col>
          <Msg good={good}>Вспомнено: {hits.length} из {list.length}.</Msg>
          <Prog value={hits.length / Math.max(1, list.length)} />
          <div style={row}>{list.map((w: string, i: number) => chip(w, typed.includes(norm(w)) ? "good" : "miss", i))}</div>
          <div style={row}>
            {good ? <Btn primary label="Больше слов →" onClick={() => { setCount(count + 1); go(count + 1); }} /> : <Btn primary label="Ещё раз" onClick={() => go(count)} />}
            {count > 5 ? <Btn label="Меньше" onClick={() => { setCount(count - 1); go(count - 1); }} /> : null}
          </div>
        </Col>
      ) : null}
    </Col>
  );
}

function Change() {
  const { t, row, shadow } = useS();
  const [n, setN] = useState(4);
  const [grid, setGrid] = useState<string[]>([]);
  const [changed, setChanged] = useState(-1);
  const [phase, setPhase] = useState<"idle" | "show" | "blank" | "find" | "result">("idle");
  const [pick, setPick] = useState(-1);
  const [score, setScore] = useState(0);
  const go = (k: number) => { setGrid(shuffle(EMOJI).slice(0, k)); setPick(-1); setPhase("show"); setChanged(rnd(k)); };
  useEffect(() => {
    if (phase === "show") { const id = setTimeout(() => setPhase("blank"), 2000 + n * 300); return () => clearTimeout(id); }
    if (phase === "blank") {
      const id = setTimeout(() => { const unused = EMOJI.filter((e: string) => !grid.includes(e)); const g = grid.slice(); g[changed] = unused[rnd(unused.length)]; setGrid(g); setPhase("find"); }, 900);
      return () => clearTimeout(id);
    }
  }, [phase]);
  const choose = (i: number) => { if (phase !== "find") return; setPick(i); setPhase("result"); if (i === changed) setScore(score + 1); };
  const cols = Math.ceil(Math.sqrt(n));
  const right = pick === changed;
  const hint = phase === "show" ? "Запоминай!" : phase === "blank" ? "…" : phase === "find" ? "Нажми на то, что изменилось" : "";
  return (
    <Col>
      <Stats items={[["Символов", n], ["Угадано", score]]} />
      {hint ? <Hint>{hint}</Hint> : null}
      {phase !== "idle" ? (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: "clamp(5px, 2.5vw, 10px)", width: "100%", maxWidth: cols * 88, margin: "0 auto" }}>
          {grid.map((c: string, i: number) => {
            const isC = phase === "result" && i === changed; const isW = phase === "result" && i === pick && !right;
            return <div key={i} className={`mt-press ${isW ? "mt-shake" : isC ? "mt-pop" : ""}`} onClick={() => choose(i)} style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, borderRadius: 18, border: `2px solid ${isC ? t.text.success : isW ? t.text.danger : t.border.subtle}`, background: isC ? t.fill.successSubtle : isW ? t.fill.dangerSubtle : t.bg.base, boxShadow: phase === "find" ? shadow : "none", cursor: phase === "find" ? "pointer" : "default", userSelect: "none" }}><span style={{ opacity: phase === "blank" ? 0 : 1, transition: "opacity .3s" }}>{c}</span></div>;
          })}
        </div>
      ) : null}
      {phase === "result" ? <Msg good={right}>{right ? "Точно! Глаз-алмаз." : "Не тот. Изменился символ в зелёной рамке."}</Msg> : null}
      <div style={row}>
        {phase === "idle" ? <Btn primary label="Начать" onClick={() => go(n)} /> : null}
        {phase === "result" ? <Btn primary label={right ? "Сложнее →" : "Ещё раз"} onClick={() => { const k = right ? Math.min(n + 1, 20) : n; setN(k); go(k); }} /> : null}
        {phase === "result" && n > 4 ? <Btn label="Проще" onClick={() => { setN(n - 1); go(n - 1); }} /> : null}
      </div>
    </Col>
  );
}

// ================= N-back =================
const NB_LET = ["К", "Т", "Л", "М", "Р", "С", "Н", "В"];
type NbT = { p: number; l: string };
function NBack() {
  const { t, c, row, muted } = useS();
  const [n, setN] = useState(1);
  const [dual, setDual] = useState(false);
  const [seq, setSeq] = useState<NbT[]>([]);
  const [i, setI] = useState(-1);
  const [show, setShow] = useState(false);
  const [rp, setRp] = useState<boolean[]>([]);
  const [rl, setRl] = useState<boolean[]>([]);
  const [flash, setFlash] = useState<"" | "good" | "bad">("");
  const [res, setRes] = useState<number | null>(null);
  const rR = useRef<{ p: boolean[]; l: boolean[] }>({ p: [], l: [] });
  rR.current = { p: rp, l: rl };
  const LEN = 20;
  const start = () => {
    const s: NbT[] = [];
    for (let k = 0; k < LEN + n; k++) {
      const p = k >= n && Math.random() < 0.3 ? s[k - n].p : rnd(9);
      const l = k >= n && Math.random() < 0.3 ? s[k - n].l : NB_LET[rnd(NB_LET.length)];
      s.push({ p, l });
    }
    setSeq(s); setRp([]); setRl([]); setRes(null); setI(0); setShow(true);
  };
  useEffect(() => {
    if (i < 0 || res !== null) return;
    const a = setTimeout(() => setShow(false), 1600);
    const b = setTimeout(() => {
      if (i + 1 >= seq.length) {
        let ok = 0, tot = 0;
        for (let k = n; k < seq.length; k++) {
          tot++; if (!!rR.current.p[k] === (seq[k].p === seq[k - n].p)) ok++;
          if (dual) { tot++; if (!!rR.current.l[k] === (seq[k].l === seq[k - n].l)) ok++; }
        }
        const pct = Math.round((ok / tot) * 100);
        setRes(pct); setI(-1);
        if (pct >= 80) reportMax("nback", n);
        if (pct >= 70) session.good++; else session.bad++;
        if (pct >= 85) fireConfetti();
      } else { setI(i + 1); setShow(true); }
    }, 2500);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [i, res]);
  const press = (kind: "p" | "l") => {
    if (i < n) return;
    const match = kind === "p" ? seq[i].p === seq[i - n].p : seq[i].l === seq[i - n].l;
    if (kind === "p") { const a = rp.slice(); a[i] = true; setRp(a); } else { const a = rl.slice(); a[i] = true; setRl(a); }
    setFlash(match ? "good" : "bad"); setTimeout(() => setFlash(""), 350);
  };
  const cur = i >= 0 ? seq[i] : null;
  return (
    <Col>
      <div style={row}><Chips options={[[1, "1-назад"], [2, "2-назад"], [3, "3-назад"]]} value={n} onChange={(v: number) => { if (i < 0) setN(v); }} /><Chips options={[["s", "Одиночный"], ["d", "Двойной"]]} value={dual ? "d" : "s"} onChange={(v: string) => { if (i < 0) setDual(v === "d"); }} /></div>
      <Stats items={[["Уровень", `${n}-назад`], ["Ход", i >= 0 ? `${i + 1}/${seq.length}` : "—"], ["Точность", res !== null ? `${res}%` : "—"]]} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, width: "100%", maxWidth: 300, margin: "0 auto", borderRadius: 20, padding: 8, background: flash === "good" ? t.fill.successSubtle : flash === "bad" ? t.fill.dangerSubtle : t.bg.subtle, transition: "background .2s" }}>
        {Array.from({ length: 9 }).map((_: unknown, k: number) => {
          const on = !!cur && show && cur.p === k;
          return <div key={k} style={{ aspectRatio: "1", borderRadius: 14, background: on ? c[0] : t.bg.base, boxShadow: on ? `0 0 24px ${c[0]}` : "none", transform: on ? "scale(1.04)" : "none", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 700, color: t.text.onColor }}>{on && dual ? cur.l : ""}</div>;
        })}
      </div>
      {i >= 0 ? (
        <div style={{ ...row, justifyContent: "center" }}>
          <Btn primary label="Место совпало" onClick={() => press("p")} disabled={i < n || !!rp[i]} />
          {dual ? <Btn primary label="Буква совпала" onClick={() => press("l")} disabled={i < n || !!rl[i]} /> : null}
        </div>
      ) : null}
      {res !== null ? <Msg good={res >= 80}>{res >= 85 ? `Точность ${res}%! Можно переходить на ${n + 1}-назад.` : res >= 60 ? `Точность ${res}%. Хорошо, потренируйся ещё на этом уровне.` : `Точность ${res}%. Попробуй уровень полегче.`}</Msg> : null}
      {i < 0 ? <div style={row}><Btn primary label="Начать" onClick={start} />{res !== null && res >= 85 && n < 3 ? <Btn label={`Перейти на ${n + 1}-назад`} onClick={() => setN(n + 1)} /> : null}</div> : null}
      <div style={muted}>Нажимай, если клетка {dual ? "или буква " : ""}совпадает с той, что была {n} {n === 1 ? "шаг" : "шага"} назад. Ничего не нажимай, если совпадения нет.</div>
    </Col>
  );
}

// ================= Faces & names =================
const FACES = ["👩", "👨", "👵", "👴", "👧", "👦", "👩‍🦰", "👨‍🦱", "👱‍♀️", "🧔", "👩‍🦳", "👨‍🦲", "👸", "🧑‍🎨", "👩‍🍳", "👨‍🚀"];
const NAMES = ["Анна", "Игорь", "Вера", "Пётр", "Соня", "Миша", "Алла", "Денис", "Ольга", "Борис", "Нина", "Глеб", "Лиза", "Артём", "Зоя", "Олег"];
function FacesGame() {
  const { t, row, muted } = useS();
  const [cnt, setCnt] = useState(3);
  const [set, setSet] = useState<[string, string][]>([]);
  const [phase, setPhase] = useState<"idle" | "study" | "quiz" | "res">("idle");
  const [order, setOrder] = useState<number[]>([]);
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState("");
  const go = (k: number) => { const f = shuffle(FACES).slice(0, k); const nm = shuffle(NAMES).slice(0, k); setSet(f.map((x: string, j: number) => [x, nm[j]] as [string, string])); setPhase("study"); setScore(0); setQi(0); setPicked(""); };
  const opts = useMemo(() => {
    if (phase !== "quiz" || !order.length) return [] as string[];
    const right = set[order[qi]][1];
    return shuffle([right].concat(shuffle(set.map((x: [string, string]) => x[1]).filter((x: string) => x !== right)).slice(0, 3)));
  }, [phase, qi, order]);
  const choose = (nm: string) => {
    if (picked) return;
    setPicked(nm);
    const ok = nm === set[order[qi]][1]; const sc = score + (ok ? 1 : 0); setScore(sc);
    setTimeout(() => { setPicked(""); if (qi + 1 >= set.length) { setPhase("res"); if (sc === set.length) fireConfetti(); } else setQi(qi + 1); }, 700);
  };
  return (
    <Col>
      <Stats items={[["Людей", cnt], ["Верно", phase === "idle" ? "—" : `${score}/${set.length}`]]} />
      {phase === "idle" ? <Col><div style={muted}>Запомни, как зовут каждого. Совет: найди связь — «Вера в очках верит в чудеса».</div><div style={row}><Btn primary label="Начать" onClick={() => go(cnt)} /></div></Col> : null}
      {phase === "study" ? (
        <Col>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 10 }}>
            {set.map(([f, nm]: [string, string], j: number) => (
              <div key={j} className="mt-pop" style={{ animationDelay: `${j * 80}ms`, padding: 12, borderRadius: 18, background: t.bg.subtle, textAlign: "center" }}>
                <div style={{ fontSize: 46 }}>{f}</div><div style={{ fontSize: 17, fontWeight: 600 }}>{nm}</div>
              </div>
            ))}
          </div>
          <div style={row}><Btn primary label="Запомнено ✓" onClick={() => { setOrder(shuffle(set.map((_: [string, string], j: number) => j))); setPhase("quiz"); }} /></div>
        </Col>
      ) : null}
      {phase === "quiz" && order.length ? (
        <Col>
          <div key={qi} className="mt-pop" style={{ fontSize: 80, textAlign: "center" }}>{set[order[qi]][0]}</div>
          <Hint>Как зовут?</Hint>
          <div style={{ ...row, justifyContent: "center" }}>
            {opts.map((nm: string) => {
              const right = nm === set[order[qi]][1];
              const bg = picked && right ? t.fill.successSubtle : picked === nm ? t.fill.dangerSubtle : t.bg.subtle;
              return <button key={nm} className="mt-press" onClick={() => choose(nm)} style={{ minHeight: 48, minWidth: 0, flex: "1 1 110px", borderRadius: 16, border: `1px solid ${t.border.subtle}`, background: bg, color: t.text.primary, fontFamily: t.font.family, fontSize: 17, fontWeight: 600, cursor: "pointer" }}>{nm}</button>;
            })}
          </div>
        </Col>
      ) : null}
      {phase === "res" ? (
        <Col>
          <Msg good={score === set.length}>{score === set.length ? "Все имена верно!" : `Верно ${score} из ${set.length}.`}</Msg>
          <div style={row}>{score === set.length && cnt < 10 ? <Btn primary label="Больше людей →" onClick={() => { setCnt(cnt + 1); go(cnt + 1); }} /> : <Btn primary label="Ещё раз" onClick={() => go(cnt)} />}</div>
        </Col>
      ) : null}
    </Col>
  );
}

// ================= Method of loci =================
const ROOMS = ["🚪 Входная дверь", "🧥 Вешалка", "🪞 Зеркало", "🍳 Плита", "🧊 Холодильник", "🛁 Ванна", "🛏️ Кровать", "🪟 Окно"];
function Loci() {
  const { t, row, muted, input } = useS();
  const [cnt, setCnt] = useState(5);
  const [items, setItems] = useState<string[]>([]);
  const [phase, setPhase] = useState<"idle" | "place" | "recall" | "res">("idle");
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState<string[]>([]);
  const go = (k: number) => { setItems(shuffle(WORDS).slice(0, k)); setStep(0); setAns([]); setPhase("place"); };
  const ok = (j: number) => norm(ans[j] || "") === norm(items[j]);
  const score = items.filter((_: string, j: number) => ok(j)).length;
  return (
    <Col>
      <Stats items={[["Предметов", cnt], ["Результат", phase === "res" ? `${score}/${items.length}` : "—"]]} />
      {phase === "idle" ? <Col><div style={muted}>Древний приём «дворец памяти». Ты мысленно идёшь по своей квартире и в каждом месте оставляешь яркий, смешной, необычный образ предмета. Потом просто «проходишь» маршрут ещё раз.</div><div style={row}><Btn primary label="Начать прогулку" onClick={() => go(cnt)} /></div></Col> : null}
      {phase === "place" ? (
        <Col>
          <Prog value={(step + 1) / items.length} />
          <div key={step} className="mt-pop" style={{ padding: 22, borderRadius: 20, background: t.bg.subtle, textAlign: "center", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 15, color: t.text.tertiary }}>Место {step + 1} из {items.length}</div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{ROOMS[step]}</div>
            <div style={{ fontSize: 15, color: t.text.secondary }}>Положи сюда:</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: t.text.accent }}>{items[step]}</div>
          </div>
          <div style={muted}>Закрой глаза на 5 секунд и представь это очень ярко: огромным, светящимся, шумным или смешным.</div>
          <div style={row}><Btn primary label={step + 1 < items.length ? "Дальше →" : "Вспомнить всё"} onClick={() => { if (step + 1 < items.length) setStep(step + 1); else setPhase("recall"); }} /></div>
        </Col>
      ) : null}
      {phase === "recall" || phase === "res" ? (
        <Col>
          <Hint>{phase === "recall" ? "Пройди маршрут: что лежит в каждом месте?" : score === items.length ? "Идеально!" : "Сравни с правильными ответами"}</Hint>
          {items.map((it: string, j: number) => (
            <div key={j} style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <div style={{ flex: "1 1 140px", fontSize: 16, fontWeight: 500 }}>{ROOMS[j]}</div>
              <input style={{ ...input, flex: "2 1 160px", width: "auto", fontSize: 16, padding: "10px 14px", borderColor: phase === "res" ? (ok(j) ? t.text.success : t.text.danger) : t.border.default }} value={ans[j] || ""} disabled={phase === "res"}
                onChange={(e: ChangeEvent<HTMLInputElement>) => { const a = ans.slice(); a[j] = e.target.value; setAns(a); }} />
              {phase === "res" && !ok(j) ? <span style={{ fontSize: 14, color: t.text.secondary }}>→ {it}</span> : null}
            </div>
          ))}
          <div style={row}>
            {phase === "recall" ? <Btn primary label="Проверить" onClick={() => { setPhase("res"); if (items.every((_: string, j: number) => ok(j))) fireConfetti(); }} /> : null}
            {phase === "res" ? (score === items.length && cnt < ROOMS.length ? <Btn primary label="Больше предметов →" onClick={() => { setCnt(cnt + 1); go(cnt + 1); }} /> : <Btn primary label="Новый маршрут" onClick={() => go(cnt)} />) : null}
          </div>
        </Col>
      ) : null}
    </Col>
  );
}

// ================= Poems =================
function splitTok(w: string): [string, string, string] {
  const m = w.match(/^([^А-Яа-яЁёA-Za-z]*)([А-Яа-яЁёA-Za-z-]+)(.*)$/);
  return m ? [m[1], m[2], m[3]] : [w, "", ""];
}
function PoemTrainer(props: { initial?: number }) {
  const { t, row, muted, c } = useS();
  const [pi, setPi] = useState(props.initial || 0);
  const [mode, setMode] = useState<"read" | "letters" | "blanks" | "lines" | "test">("read");
  const [pct, setPct] = useState(30);
  const [seed, setSeed] = useState(0);
  const [rev, setRev] = useState<string[]>([]);
  const [shown, setShown] = useState(1);
  const [ans, setAns] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [learned, setLearned] = usePersist<string[]>("poems", []);
  const p = POEMS[pi];
  useEffect(() => { setRev([]); setShown(1); setAns([]); setChecked(false); }, [pi, mode, pct, seed]);
  const hideMap = useMemo(() => p.lines.map((l: string) => l.split(" ").map(() => Math.random() * 100 < pct)), [pi, pct, seed]);
  const testIdx = useMemo(() => p.lines.map((l: string) => { const ws = l.split(" "); const cand = ws.map((w: string, k: number) => [splitTok(w)[1].length, k] as [number, number]).filter((x: [number, number]) => x[0] >= 3); return cand.length ? cand[rnd(cand.length)][1] : 0; }), [pi, seed, mode]);
  const lineStyle: CSSProperties = { fontSize: 19, lineHeight: "32px", color: t.text.primary };
  const blank = (core: string, key: string, revealed: boolean) => revealed
    ? <span className="mt-pop" style={{ color: t.text.accent }}>{core}</span>
    : <span onClick={() => setRev(rev.concat(key))} style={{ display: "inline-block", minWidth: core.length * 9, borderBottom: `2px solid ${c[0]}`, cursor: "pointer", color: "transparent" }}>{core}</span>;
  const testOk = (li: number) => norm(ans[li] || "") === norm(splitTok(p.lines[li].split(" ")[testIdx[li]])[1]);
  const allOk = p.lines.every((_: string, li: number) => testOk(li));
  return (
    <Col>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
        {POEMS.map((x: Poem, i: number) => (
          <div key={i} className="mt-press" onClick={() => setPi(i)} style={{ cursor: "pointer", padding: "10px 12px", borderRadius: 16, background: i === pi ? t.fill.accentSubtle : t.bg.subtle, border: `1px solid ${i === pi ? c[0] : "transparent"}` }}>
            <div style={{ fontSize: 14, fontWeight: 600, lineHeight: "18px" }}>{x.t}</div>
            <div style={{ fontSize: 12, color: t.text.tertiary }}>{x.a} · {x.lines.length} стр.{learned.includes(x.t) ? " · ✓ выучено" : ""}</div>
          </div>
        ))}
      </div>
      <Chips options={[["read", "1. Читать"], ["letters", "2. Первые буквы"], ["blanks", "3. Пропуски"], ["lines", "4. По строкам"], ["test", "5. Проверка"]]} value={mode} onChange={(v: "read" | "letters" | "blanks" | "lines" | "test") => setMode(v)} />
      <div key={`${pi}-${mode}`} className="mt-fade" style={{ padding: "18px 18px", borderRadius: 20, background: t.bg.subtle }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{p.t}</div>
        <div style={{ fontSize: 14, color: t.text.tertiary, marginBottom: 10 }}>{p.a}</div>
        {p.lines.map((l: string, li: number) => {
          if (mode === "lines" && li >= shown) return null;
          if (mode === "read" || mode === "lines") return <div key={li} className="mt-fade" style={lineStyle}>{l}</div>;
          const ws = l.split(" ");
          return (
            <div key={li} style={{ ...lineStyle, display: "flex", flexWrap: "wrap", gap: "0 6px", alignItems: "baseline" }}>
              {ws.map((w: string, k: number) => {
                const [pre, core, post] = splitTok(w);
                if (!core) return <span key={k}>{w}</span>;
                if (mode === "letters") return <span key={k}>{pre}{core[0]}<span style={{ color: t.text.tertiary }}>{"·".repeat(Math.max(0, core.length - 1))}</span>{post}</span>;
                if (mode === "blanks") { const key = `${li}-${k}`; return hideMap[li][k] ? <span key={k}>{pre}{blank(core, key, rev.includes(key))}{post}</span> : <span key={k}>{w}</span>; }
                if (k === testIdx[li]) {
                  return <span key={k}>{pre}<input value={ans[li] || ""} disabled={checked} onChange={(e: ChangeEvent<HTMLInputElement>) => { const a = ans.slice(); a[li] = e.target.value; setAns(a); }}
                    style={{ width: `${Math.max(4, core.length + 1)}ch`, fontSize: 17, fontFamily: t.font.family, padding: "2px 6px", borderRadius: 8, border: `2px solid ${checked ? (testOk(li) ? t.text.success : t.text.danger) : c[0]}`, background: t.bg.base, color: t.text.primary }} />{checked && !testOk(li) ? <span style={{ color: t.text.success, fontSize: 15 }}> {core}</span> : null}{post}</span>;
                }
                return <span key={k}>{w}</span>;
              })}
            </div>
          );
        })}
      </div>
      {mode === "read" ? <div style={muted}>Прочитай вслух 3 раза, медленно, представляя картинку. Потом переходи к шагу 2.</div> : null}
      {mode === "letters" ? <div style={muted}>Читай вслух по первым буквам. Если есть запинки — вернись к шагу 1.</div> : null}
      {mode === "blanks" ? <Col><Chips options={[[30, "30%"], [60, "60%"], [100, "Все слова"]]} value={pct} onChange={(v: number) => setPct(v)} /><div style={muted}>Проговори пропущенные слова. Нажми на пропуск, чтобы подсмотреть.</div><div style={row}><Btn label="Другие пропуски" onClick={() => setSeed(seed + 1)} /></div></Col> : null}
      {mode === "lines" ? <Col><div style={muted}>Скажи следующую строку по памяти, потом открой её и проверь себя.</div><div style={row}>{shown < p.lines.length ? <Btn primary label="Открыть следующую строку" onClick={() => setShown(shown + 1)} /> : <Btn label="Сначала" onClick={() => setShown(1)} />}</div></Col> : null}
      {mode === "test" ? (
        <Col>
          {checked ? <Msg good={allOk}>{allOk ? "Без единой ошибки — стихотворение твоё!" : "Почти! Правильные слова подсвечены зелёным."}</Msg> : null}
          <div style={row}>{!checked ? <Btn primary label="Проверить" onClick={() => { setChecked(true); if (allOk) { fireConfetti(); if (!learned.includes(p.t)) setLearned(learned.concat(p.t)); } }} /> : <Btn primary label="Ещё раз" onClick={() => setSeed(seed + 1)} />}</div>
        </Col>
      ) : null}
    </Col>
  );
}

// ================= Mind =================
function Stroop() {
  const { t, c, row, muted } = useS();
  const COLS: [string, string][] = [["красный", t.dataviz.negative], ["синий", c[0]], ["жёлтый", c[1]], ["зелёный", t.text.success]];
  const N = 20;
  const [k, setK] = useState(-1);
  const [tr, setTr] = useState<[number, number]>([0, 0]);
  const [ok, setOk] = useState(0);
  const [st, setSt] = useState(0);
  const [res, setRes] = useState(0);
  const [fb, setFb] = useState<"" | "good" | "bad">("");
  const mk = (): [number, number] => { const w = rnd(4); let ink = rnd(4); if (Math.random() < 0.75) while (ink === w) ink = rnd(4); return [w, ink]; };
  const start = () => { setK(0); setOk(0); setTr(mk()); setSt(Date.now()); setRes(0); };
  const ans = (i: number) => {
    if (k < 0) return;
    const g = i === tr[1]; const o = ok + (g ? 1 : 0); setOk(o); setFb(g ? "good" : "bad"); setTimeout(() => setFb(""), 250);
    if (k + 1 >= N) { setRes((Date.now() - st) / N); setK(-1); if (o >= 18) fireConfetti(); } else { setK(k + 1); setTr(mk()); }
  };
  return (
    <Col>
      <Stats items={[["Задание", k >= 0 ? `${k + 1}/${N}` : "—"], ["Верно", ok], ["Темп", res ? `${(res / 1000).toFixed(2)} с` : "—"]]} />
      <div className={fb === "bad" ? "mt-shake" : ""} style={{ padding: "34px 10px", borderRadius: 20, background: fb === "good" ? t.fill.successSubtle : fb === "bad" ? t.fill.dangerSubtle : t.bg.subtle, textAlign: "center", transition: "background .2s" }}>
        {k >= 0 ? <span key={k} className="mt-pop" style={{ display: "inline-block", fontSize: 44, fontWeight: 800, color: COLS[tr[1]][1], textTransform: "uppercase" }}>{COLS[tr[0]][0]}</span> : <span style={{ fontSize: 17, color: t.text.secondary }}>Выбирай цвет букв, а не смысл слова</span>}
      </div>
      {k >= 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
          {COLS.map(([nm, col]: [string, string], i: number) => (
            <button key={nm} className="mt-press" onClick={() => ans(i)} style={{ minHeight: 52, borderRadius: 16, border: `1px solid ${t.border.subtle}`, background: t.bg.base, color: t.text.primary, fontFamily: t.font.family, fontSize: 16, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ width: 16, height: 16, borderRadius: 99, background: col }} />{nm}
            </button>
          ))}
        </div>
      ) : <div style={row}><Btn primary label={res ? "Ещё раз" : "Начать"} onClick={start} /></div>}
      {res ? <Msg good={ok >= 17}>Верно {ok} из {N}, в среднем {(res / 1000).toFixed(2)} с на ответ.</Msg> : null}
      <div style={muted}>Тест Струпа тренирует умение подавлять автоматическую реакцию — важную часть внимания.</div>
    </Col>
  );
}

function MathGame() {
  const { t, row } = useS();
  const [left, setLeft] = useState(0);
  const [run, setRun] = useState(false);
  const [q, setQ] = useState<[string, number]>(["", 0]);
  const [ans, setAns] = useState("");
  const [ok, setOk] = useState(0);
  const [bad, setBad] = useState(0);
  const [best, setBest] = usePersist<number>("best:MathGame", 0);
  const [fb, setFb] = useState(0);
  const mk = (lvl: number): [string, number] => {
    const r = rnd(lvl < 3 ? 2 : lvl < 6 ? 3 : 4);
    const m = 10 + lvl * 8;
    if (r === 0) { const a = 2 + rnd(m), b = 2 + rnd(m); return [`${a} + ${b}`, a + b]; }
    if (r === 1) { const a = 5 + rnd(m), b = 1 + rnd(a); return [`${a} − ${b}`, a - b]; }
    if (r === 2) { const a = 2 + rnd(8), b = 2 + rnd(3 + lvl); return [`${a} × ${b}`, a * b]; }
    const b = 2 + rnd(8), a = b * (2 + rnd(8)); return [`${a} ÷ ${b}`, a / b];
  };
  useEffect(() => { if (!run) return; if (left <= 0) { setRun(false); setBest(Math.max(best, ok)); if (ok > best && best > 0) fireConfetti(); return; } const id = setTimeout(() => setLeft(left - 1), 1000); return () => clearTimeout(id); }, [run, left]);
  const start = () => { setOk(0); setBad(0); setLeft(60); setRun(true); setQ(mk(0)); setAns(""); };
  const check = () => { if (!ans) return; if (Number(ans) === q[1]) { const o = ok + 1; setOk(o); setQ(mk(Math.floor(o / 4))); } else { setBad(bad + 1); setFb(fb + 1); } setAns(""); };
  return (
    <Col>
      <Stats items={[["Время", `${left} с`], ["Верно", ok], ["Ошибки", bad], ["Рекорд", best || "—"]]} />
      <Prog value={left / 60} />
      {run ? (
        <Col>
          <div key={`${q[0]}-${fb}`} className={fb ? "mt-shake" : "mt-pop"} style={{ fontSize: 42, fontWeight: 700, textAlign: "center", padding: "18px 0", color: t.text.primary, fontVariantNumeric: "tabular-nums" }}>{q[0]} = ?</div>
          <TextIn big numeric value={ans} onChange={setAns} onEnter={check} placeholder="Ответ + Enter" />
          <div style={row}><Btn primary label="Ответ" onClick={check} /></div>
        </Col>
      ) : <Col>{left === 0 && ok ? <Msg good>За минуту решено {ok} примеров!</Msg> : <Hint>60 секунд, примеры усложняются с каждым успехом</Hint>}<div style={row}><Btn primary label="Старт" onClick={start} /></div></Col>}
    </Col>
  );
}

function Reaction() {
  const { t, row, c } = useS();
  const [phase, setPhase] = useState<"idle" | "wait" | "go" | "early" | "shown">("idle");
  const [times, setTimes] = useState<number[]>([]);
  const goAt = useRef(0);
  const tm = useRef(0);
  useEffect(() => () => clearTimeout(tm.current), []);
  const arm = () => { setPhase("wait"); tm.current = window.setTimeout(() => { goAt.current = performance.now(); setPhase("go"); }, 1500 + Math.random() * 2500); };
  const tap = () => {
    if (phase === "wait") { clearTimeout(tm.current); setPhase("early"); return; }
    if (phase === "go") { const ms = Math.round(performance.now() - goAt.current); const a = times.concat(ms).slice(-5); setTimes(a); setPhase("shown"); if (ms < 250) fireConfetti(); return; }
    arm();
  };
  const last = times[times.length - 1];
  const avg = times.length ? Math.round(times.reduce((a: number, b: number) => a + b, 0) / times.length) : 0;
  const bg = phase === "go" ? t.text.success : phase === "wait" ? c[0] : phase === "early" ? t.fill.dangerSubtle : t.bg.subtle;
  const label = phase === "idle" ? "Нажми, чтобы начать" : phase === "wait" ? "Жди зелёного…" : phase === "go" ? "ЖМИ!" : phase === "early" ? "Слишком рано! Нажми ещё раз" : `${last} мс — нажми для новой попытки`;
  return (
    <Col>
      <Stats items={[["Последний", last ? `${last} мс` : "—"], ["Среднее (5)", avg ? `${avg} мс` : "—"], ["Лучший", times.length ? `${Math.min(...times)} мс` : "—"]]} />
      <div onClick={tap} className="mt-press" style={{ height: 200, borderRadius: 24, background: bg, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 16, fontSize: phase === "go" ? 40 : 19, fontWeight: 700, color: phase === "go" || phase === "wait" ? t.text.onColor : t.text.primary, cursor: "pointer", userSelect: "none", transition: "background .15s" }}>{label}</div>
      <div style={row}><Hint>Типичная реакция взрослого — 200–300 мс</Hint></div>
    </Col>
  );
}

// ================= sections =================
const READ_ITEMS: Item[] = [
  { id: "rsvp", icon: "⚡", name: "Быстрый показ", short: "Слова по одному или группами" },
  { id: "schulte", icon: "🔢", name: "Таблица Шульте", short: "Боковое зрение и поиск" },
  { id: "periph", icon: "↔️", name: "Широкий взгляд", short: "Поле зрения" },
  { id: "test", icon: "⏱️", name: "Тест скорости", short: "Слов/мин и понимание" },
];
const MEM_ITEMS: Item[] = [
  { id: "pairs", icon: "🃏", name: "Найди пары", short: "Зрительная память" },
  { id: "number", icon: "🔟", name: "Запомни число", short: "Кратковременная память" },
  { id: "simon", icon: "✨", name: "Последовательность", short: "Порядок и ритм" },
  { id: "words", icon: "📝", name: "Запомни слова", short: "Словесная память" },
  { id: "change", icon: "👁️", name: "Что изменилось?", short: "Детали" },
  { id: "nback", icon: "🧠", name: "N-назад", short: "Рабочая память" },
  { id: "faces", icon: "🙂", name: "Лица и имена", short: "Память на людей" },
  { id: "loci", icon: "🏛️", name: "Дворец памяти", short: "Метод мест" },
];
const MIND_ITEMS: Item[] = [
  { id: "stroop", icon: "🎨", name: "Тест Струпа", short: "Контроль внимания" },
  { id: "math", icon: "➗", name: "Счёт в уме", short: "Минутный спринт" },
  { id: "react", icon: "⚡", name: "Реакция", short: "Скорость ответа" },
];
const DESC: Record<string, string> = {
  rsvp: "Текст показывается по словам в одной точке — глазам не нужно бегать по строке.",
  schulte: "Найди числа от 1 до 25 по порядку как можно быстрее.",
  periph: "Удерживай взгляд в центре и замечай цифры по краям. Поле постепенно расширяется.",
  test: "Прочитай текст, ответь на вопросы и узнай свою скорость.",
  pairs: "Открывай по две карточки и ищи одинаковые.",
  number: "Запомни число и введи его. Верно — число станет длиннее.",
  simon: "Плитки загораются по очереди — повтори порядок.",
  words: "Запомни список слов, потом вспомни как можно больше.",
  change: "Запомни символы — после паузы один заменится.",
  nback: "Классика тренировки рабочей памяти: сравнивай текущий шаг с тем, что был N шагов назад.",
  faces: "Запомни имена людей, потом узнай каждого.",
  loci: "Пошаговая прогулка по «дворцу памяти».",
  stroop: "Слово означает один цвет, а написано другим. Выбирай цвет букв.",
  math: "Решай примеры как можно быстрее за 60 секунд.",
  react: "Нажми, как только поле станет зелёным.",
};

const PLAN: [string, string, string, string][] = [
  ["1 мин", "⚡", "Реакция", "Разбудить внимание"],
  ["2 мин", "🔢", "Таблица Шульте", "2 таблицы подряд"],
  ["3 мин", "⚡", "Быстрый показ", "Один текст, +25 слов/мин к прошлому разу"],
  ["3 мин", "🧠", "N-назад", "Один подход на своём уровне"],
  ["2 мин", "🃏", "Найди пары или Лица и имена", "Чередуй по дням"],
  ["3 мин", "📜", "Стихи наизусть", "Один шаг тренажёра; вчерашний стих — шаг «Проверка»"],
  ["1 мин", "🎨", "Тест Струпа", "Финальный рывок"],
];
const PLAN_GO: [Tab, string][] = [["mind", "react"], ["read", "schulte"], ["read", "rsvp"], ["mem", "nback"], ["mem", "pairs"], ["poem", "poem"], ["mind", "stroop"]];
const TIPS: [string, string, string, string][] = [
  ["🔁", "Вспоминай, а не перечитывай", "Самопроверка и повторы с паузами (через день, 3 дня, неделю) — один из самых надёжных способов запоминать.", "Сильные доказательства"],
  ["😴", "Сон 7–9 часов", "Во сне мозг закрепляет то, всё новое за день.", "Сильные доказательства"],
  ["🚶‍♀️", "Движение", "Регулярные прогулки и спорт полезны для памяти и настроения.", "Хорошие доказательства"],
  ["🏛️", "Метод мест и группировка", "Образы на знакомом маршруте и разбиение на кусочки (8-916-123-45-67) резко увеличивают объём запоминаемого.", "Хорошие доказательства"],
  ["🧠", "N-назад и игры", "Тренировки улучшают результат в самих упражнениях. Перенос на «общий ум» в исследованиях маленький — поэтому важно и учить настоящие вещи, например стихи.", "Эффект в основном в самом упражнении"],
  ["⚡", "Скорочтение — честно", "Быстрый показ слов увеличивает скорость, но при очень высокой скорости понимание падает. Цель — читать быстрее без потери смысла, а не 1000 слов/мин.", "Есть ограничения"],
  ["🎯", "Одно дело за раз", "Многозадачность мешает запоминанию. Убери телефон, когда учишь важное.", "Хорошие доказательства"],
];

type Tab = "read" | "mem" | "poem" | "mind";

type TabId = "home" | "read" | "mem" | "poem" | "mind" | "profile";
type View = { kind: "tab" } | { kind: "ex"; id: string; plan: number; walk: boolean } | { kind: "result"; r: Result; plan: number; walk: boolean };
type Unit = { id: TabId; name: string; icon: string; col: readonly [string, string]; items: Item[] };

const UNITS: Unit[] = [
  { id: "mem", name: "Память", icon: "🧠", col: PAL.green, items: MEM_ITEMS },
  { id: "read", name: "Скорочтение", icon: "📖", col: PAL.blue, items: READ_ITEMS },
  { id: "poem", name: "Стихи", icon: "📜", col: PAL.purple, items: POEMS.map((p: Poem, i: number) => ({ id: "poem:" + i, icon: "📜", name: p.t, short: p.a })) },
  { id: "mind", name: "Внимание", icon: "🎯", col: PAL.orange, items: MIND_ITEMS },
];
const NAV: [TabId, string, string][] = [["home", "🏠", "Главная"], ["read", "📖", "Чтение"], ["mem", "🧠", "Память"], ["poem", "📜", "Стихи"], ["mind", "🎯", "Внимание"], ["profile", "👤", "Профиль"]];

let toast: (s: string) => void = () => {};

function Mascot(p: { size?: number; mood?: "happy" | "calm" | "wow"; cls?: string }) {
  const s = p.size || 96;
  const mood = p.mood || "calm";
  return (
    <svg className={p.cls || "mt-float"} width={s} height={s} viewBox="0 0 120 120" aria-hidden="true" style={{ flex: "0 0 auto", overflow: "visible" }}>
      <ellipse cx="60" cy="112" rx="34" ry="5" fill="rgba(0,0,0,.12)" />
      <path d="M60 14c-10-9-30-7-35 7-15 1-23 16-17 29-10 9-8 27 6 33 1 15 18 23 31 16 5 6 10 8 15 8s10-2 15-8c13 7 30-1 31-16 14-6 16-24 6-33 6-13-2-28-17-29-5-14-25-16-35-7z" fill="#FF8FB8" stroke="#E0558C" strokeWidth="4" strokeLinejoin="round" />
      <path d="M60 18v20M38 30c6 2 9 7 9 13M82 30c-6 2-9 7-9 13M24 58c6-3 12-2 16 2M96 58c-6-3-12-2-16 2" fill="none" stroke="#E0558C" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="45" cy="64" r="11" fill="#fff" /><circle cx="75" cy="64" r="11" fill="#fff" />
      <circle cx={mood === "wow" ? 45 : 47} cy="65" r="6" fill="#1F2A37" /><circle cx={mood === "wow" ? 75 : 77} cy="65" r="6" fill="#1F2A37" />
      <circle cx="49" cy="62" r="2" fill="#fff" /><circle cx="79" cy="62" r="2" fill="#fff" />
      <circle cx="33" cy="78" r="5" fill="#FF5C93" opacity=".55" /><circle cx="87" cy="78" r="5" fill="#FF5C93" opacity=".55" />
      {mood === "happy" ? <path d="M48 80q12 14 24 0z" fill="#B3264F" stroke="#B3264F" strokeWidth="3" strokeLinejoin="round" /> : mood === "wow" ? <ellipse cx="60" cy="84" rx="6" ry="7" fill="#B3264F" /> : <path d="M50 81q10 8 20 0" fill="none" stroke="#B3264F" strokeWidth="4" strokeLinecap="round" />}
    </svg>
  );
}

function Btn3D(p: { label: ReactNode; onClick: () => void; col?: readonly [string, string]; light?: boolean; full?: boolean; big?: boolean; disabled?: boolean }) {
  const { t } = useS();
  const col = p.col || PAL.green;
  const bg = p.light ? t.bg.elevated : col[0];
  const edge = p.light ? t.border.default : col[1];
  return (
    <button className="mt-3d" disabled={p.disabled} onClick={() => { buzz(10); play("tap"); p.onClick(); }}
      style={{ width: p.full ? "100%" : undefined, minHeight: p.big ? 56 : 46, padding: "0 22px", borderRadius: 16, border: p.light ? `2px solid ${edge}` : "none", background: bg, color: p.light ? (col === PAL.green ? t.text.primary : col[1]) : "#fff", boxShadow: `0 4px 0 ${edge}`, fontFamily: t.font.family, fontSize: p.big ? 18 : 16, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase", cursor: p.disabled ? "default" : "pointer", opacity: p.disabled ? 0.5 : 1 }}>{p.label}</button>
  );
}

function Ring(p: { value: number; size: number; col: string; children?: ReactNode }) {
  const { t } = useS();
  const r = p.size / 2 - 7, C = 2 * Math.PI * r, v = Math.max(0, Math.min(1, p.value));
  return (
    <div style={{ position: "relative", width: p.size, height: p.size, flex: "0 0 auto" }}>
      <svg width={p.size} height={p.size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={p.size / 2} cy={p.size / 2} r={r} fill="none" stroke={t.bg.subtle} strokeWidth="10" />
        <circle cx={p.size / 2} cy={p.size / 2} r={r} fill="none" stroke={p.col} strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - v)} style={{ transition: "stroke-dashoffset 1s cubic-bezier(.2,.9,.3,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>{p.children}</div>
    </div>
  );
}

function Stars(p: { n: number; size?: number; anim?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
      {[0, 1, 2].map((k: number) => <span key={k} className={p.anim && k < p.n ? "mt-starpop" : ""} style={{ fontSize: p.size || 14, filter: k < p.n ? "none" : "grayscale(1)", opacity: k < p.n ? 1 : 0.3, animationDelay: `${0.3 + k * 0.25}s` }}>⭐</span>)}
    </div>
  );
}

function Toast() {
  const [m, setM] = useState("");
  const [k, setK] = useState(0);
  useEffect(() => { toast = (s: string) => { setM(s); setK((x: number) => x + 1); }; }, []);
  useEffect(() => { if (!m) return; const id = setTimeout(() => setM(""), 2200); return () => clearTimeout(id); }, [k]);
  if (!m) return null;
  return <div key={k} className="mt-toast" style={{ position: "fixed", left: "50%", top: "calc(env(safe-area-inset-top) + 70px)", transform: "translateX(-50%)", zIndex: 80, background: "#1F2A37", color: "#fff", padding: "12px 18px", borderRadius: 16, fontWeight: 700, fontSize: 15, boxShadow: "0 8px 24px rgba(0,0,0,.25)", maxWidth: "86vw", textAlign: "center" }}>{m}</div>;
}

function useGame() {
  const [xp] = usePersist<number>("xp", 0);
  const [dayXp] = usePersist<number>("xpday:" + today(), 0);
  const [stars] = usePersist<Record<string, number>>("stars", {});
  const [poems] = usePersist<string[]>("poems", []);
  const [done] = usePersist<number[]>("plan:" + today(), []);
  const [mute, setMute] = usePersist<boolean>("mute", false);
  const streak = useStreak();
  const level = levelOf(xp);
  const starOf = (id: string) => id.startsWith("poem:") ? (poems.includes(POEMS[Number(id.slice(5))].t) ? 3 : stars[id] || 0) : stars[id] || 0;
  return { xp, dayXp, stars, poems, done, mute, setMute, streak, level, starOf };
}

function TopBar(p: { onProfile: () => void }) {
  const { t } = useS();
  const g = useGame();
  const chip = (icon: string, val: ReactNode, col: string, k: string) => (
    <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontWeight: 900, fontSize: 17, color: col }}><span key={String(val)} className="mt-pop" style={{ fontSize: 22 }}>{icon}</span>{val}</div>
  );
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 40, background: t.bg.base, borderBottom: `2px solid ${t.border.subtle}`, paddingTop: "env(safe-area-inset-top)" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", height: 56, padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={p.onProfile} className="mt-press" style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: t.font.family }}>
          <div style={{ width: 34, height: 34, borderRadius: 12, background: PAL.purple[0], boxShadow: `0 3px 0 ${PAL.purple[1]}`, color: "#fff", fontWeight: 900, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>{g.level}</div>
          <span style={{ fontWeight: 800, fontSize: 13, color: t.text.secondary }}>ур.</span>
        </button>
        {chip("🔥", g.streak, g.streak ? PAL.orange[0] : t.text.tertiary, "s")}
        {chip("💎", g.xp, PAL.blue[0], "x")}
        <button aria-label="Звук" onClick={() => { g.setMute(!g.mute); if (g.mute) play("tap"); }} className="mt-press" style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", padding: 4 }}>{g.mute ? "🔇" : "🔊"}</button>
      </div>
    </div>
  );
}

function BottomNav(p: { tab: TabId; onTab: (x: TabId) => void }) {
  const { t } = useS();
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, background: t.bg.base, borderTop: `2px solid ${t.border.subtle}`, paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", padding: "6px 4px" }}>
        {NAV.map(([id, ic, nm]: [TabId, string, string]) => {
          const on = id === p.tab;
          return (
            <button key={id} onClick={() => { if (!on) { buzz(8); play("tap"); } p.onTab(id); }} style={{ flex: 1, minWidth: 0, background: on ? t.fill.accentSubtle : "transparent", border: `2px solid ${on ? PAL.blue[0] : "transparent"}`, borderRadius: 14, padding: "5px 0 3px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 1, fontFamily: t.font.family }}>
              <span className={on ? "mt-bounce" : ""} style={{ fontSize: 24, lineHeight: "28px", filter: on ? "none" : "saturate(.6)" }}>{ic}</span>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: on ? PAL.blue[1] : t.text.tertiary, whiteSpace: "nowrap" }}>{nm}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PathUnit(p: { u: Unit; onOpen: (id: string) => void }) {
  const { t } = useS();
  const g = useGame();
  const st = p.u.items.map((x: Item) => g.starOf(x.id));
  const cur = st.findIndex((s: number) => s === 0);
  const total = st.reduce((a: number, b: number) => a + b, 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ background: p.u.col[0], boxShadow: `0 5px 0 ${p.u.col[1]}`, borderRadius: 20, padding: "16px 18px", color: "#fff", display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 38 }}>{p.u.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, opacity: 0.85, textTransform: "uppercase" }}>Раздел</div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>{p.u.name}</div>
        </div>
        <div style={{ fontWeight: 900, fontSize: 15, background: "rgba(255,255,255,.22)", borderRadius: 12, padding: "6px 10px" }}>⭐ {total}/{st.length * 3}</div>
      </div>
      <div style={{ position: "relative", padding: "18px 0 8px" }}>
        {p.u.items.map((x: Item, k: number) => {
          const locked = k > 0 && st[k - 1] === 0 && st[k] === 0;
          const isCur = k === cur;
          const dx = Math.sin(k * 1.1).toFixed(3);
          const bg = locked ? t.bg.subtle : p.u.col[0];
          const edge = locked ? t.border.default : p.u.col[1];
          return (
            <div key={x.id} style={{ transform: `translateX(calc(${dx} * min(60px, 15vw)))`, marginBottom: 14 }}><div className="mt-fade" style={{ animationDelay: `${k * 50}ms`, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
              {isCur ? <div className="mt-bob" style={{ background: t.bg.elevated, border: `2px solid ${t.border.default}`, color: p.u.col[1], fontWeight: 900, fontSize: 13, letterSpacing: 0.6, padding: "5px 12px", borderRadius: 12, marginBottom: 8 }}>НАЧАТЬ</div> : null}
              <button className={"mt-node" + (isCur ? " mt-pulse" : "")} aria-label={x.name} onClick={() => {
                if (locked) { buzz([30, 40, 30]); play("bad"); toast("🔒 Сначала пройди предыдущий урок"); return; }
                p.onOpen(x.id);
              }} style={{ width: 76, height: 70, borderRadius: "50%", border: "none", background: bg, boxShadow: `0 7px 0 ${edge}`, fontSize: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", ["--c" as string]: p.u.col[0] } as CSSProperties}>
                <span style={{ filter: locked ? "grayscale(1)" : "none", opacity: locked ? 0.5 : 1 }}>{locked ? "🔒" : st[k] >= 3 ? "👑" : x.icon}</span>
              </button>
              <div style={{ marginTop: 10, maxWidth: 160, textAlign: "center", fontSize: 13, overflowWrap: "anywhere", fontWeight: 800, color: locked ? t.text.tertiary : t.text.primary, lineHeight: "16px" }}>{x.name}</div>
              {st[k] > 0 ? <Stars n={st[k]} size={13} /> : null}
            </div></div>
          );
        })}
      </div>
    </div>
  );
}

function DailyTasks(p: { onGo: (i: number, walk: boolean) => void }) {
  const { t, card } = useS();
  const g = useGame();
  const n = g.done.length;
  return (
    <div style={{ ...card, gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontSize: 20, fontWeight: 900 }}>📋 Задания дня</div>
        <div style={{ fontWeight: 900, color: n >= PLAN.length ? PAL.green[1] : t.text.secondary }}>{n}/{PLAN.length}</div>
      </div>
      <Prog value={n / PLAN.length} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {PLAN.map(([m, ic, nm, d]: [string, string, string, string], i: number) => {
          const ok = g.done.includes(i);
          return (
            <button key={i} className="mt-plan" onClick={() => p.onGo(i, false)} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", background: "none", border: "none", borderTop: i ? `2px solid ${t.border.subtle}` : "none", cursor: "pointer", textAlign: "left", fontFamily: t.font.family, color: t.text.primary }}>
              <div style={{ width: 40, height: 40, flex: "0 0 40px", borderRadius: 14, background: ok ? PAL.green[0] : t.bg.subtle, boxShadow: ok ? `0 3px 0 ${PAL.green[1]}` : `0 3px 0 ${t.border.default}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#fff", fontWeight: 900 }}>{ok ? "✓" : ic}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, textDecoration: ok ? "line-through" : "none", opacity: ok ? 0.6 : 1 }}>{nm}</div>
                <div style={{ fontSize: 13, color: t.text.secondary }}>{m} · {d}</div>
              </div>
              <span className="mt-go" style={{ fontWeight: 900, color: PAL.blue[0], fontSize: 13 }}>Начать →</span>
            </button>
          );
        })}
      </div>
      <Btn3D full big label={n >= PLAN.length ? "🎉 Всё выполнено! Ещё раз" : n ? "▶ Продолжить план" : "▶ Начать план"} onClick={() => { const k = PLAN.findIndex((_: unknown, i: number) => !g.done.includes(i)); p.onGo(k < 0 ? 0 : k, true); }} />
    </div>
  );
}

function greet() { const h = new Date().getHours(); return h < 5 ? "Доброй ночи!" : h < 12 ? "Доброе утро!" : h < 18 ? "Добрый день!" : "Добрый вечер!"; }

function Home(p: { onGo: (i: number, walk: boolean) => void; onOpen: (id: string) => void }) {
  const { t, card } = useS();
  const g = useGame();
  const goalOk = g.dayXp >= DAILY_GOAL;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ ...card, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Mascot size={84} mood={goalOk ? "happy" : "calm"} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 900 }}>{greet()}</div>
          <div style={{ fontSize: 14, color: t.text.secondary, lineHeight: "19px" }}>{goalOk ? "Цель дня выполнена — так держать! 🎉" : g.streak ? `Серия ${g.streak} дн. Не прерывай её!` : "Начнём тренировку? 15 минут в день — и прогресс заметен."}</div>
        </div>
        <Ring value={g.dayXp / DAILY_GOAL} size={78} col={goalOk ? PAL.green[0] : PAL.yellow[0]}>
          <span style={{ fontSize: 18, fontWeight: 900, lineHeight: "20px" }}>{Math.min(g.dayXp, 999)}</span>
          <span style={{ fontSize: 10, fontWeight: 800, color: t.text.tertiary }}>из {DAILY_GOAL} XP</span>
        </Ring>
      </div>
      <DailyTasks onGo={p.onGo} />
      {UNITS.map((u: Unit) => <PathUnit key={u.id} u={u} onOpen={p.onOpen} />)}
    </div>
  );
}

function UnitTab(p: { u: Unit; onOpen: (id: string) => void }) {
  const { t } = useS();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <PathUnit u={p.u} onOpen={p.onOpen} />
      <div style={{ textAlign: "center", fontSize: 13, color: t.text.tertiary, fontWeight: 700 }}>Пройденные уроки можно повторять — звёзды обновятся по лучшему результату.</div>
    </div>
  );
}

const BEST_ROWS: [string, string, (v: number) => string][] = [
  ["best:Schulte", "🔢 Таблица Шульте", (v: number) => `${v.toFixed(1)} с`],
  ["best:NumberGame", "🔟 Запомни число", (v: number) => `${v} цифр`],
  ["best:Simon", "✨ Последовательность", (v: number) => `${v} шагов`],
  ["best:WordsGame", "📝 Запомни слова", (v: number) => `${v} слов`],
  ["best:MathGame", "➗ Счёт в уме", (v: number) => `${v} примеров`],
];

function Profile() {
  const { t, card, muted } = useS();
  const g = useGame();
  const [ach] = usePersist<string[]>("ach", []);
  const [maxes] = usePersist<Record<string, number>>("maxes", {});
  const [sessions] = usePersist<number>("sessions", 0);
  const [streakRaw] = usePersist<{ last: string; count: number; total: number }>("streak", { last: "", count: 0, total: 0 });
  const [confirm, setConfirm] = useState(false);
  const [tips, setTips] = useState(false);
  const lo = xpFor(g.level), hi = xpFor(g.level + 1);
  const tile = (ic: string, v: ReactNode, l: string, col: string) => (
    <div style={{ flex: "1 1 40%", boxSizing: "border-box", minWidth: 0, border: `2px solid ${t.border.subtle}`, borderRadius: 18, padding: "12px 14px", display: "flex", gap: 10, alignItems: "center" }}>
      <span style={{ fontSize: 26 }}>{ic}</span>
      <div><div style={{ fontSize: 20, fontWeight: 900, color: col }}>{v}</div><div style={{ fontSize: 12, fontWeight: 700, color: t.text.tertiary }}>{l}</div></div>
    </div>
  );
  const h2 = (s: string) => <div style={{ fontSize: 20, fontWeight: 900, margin: "6px 2px 0" }}>{s}</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ ...card, alignItems: "center", textAlign: "center", gap: 8 }}>
        <Mascot size={100} mood="happy" />
        <div style={{ fontSize: 26, fontWeight: 900 }}>Уровень {g.level}</div>
        <div style={{ width: "100%" }}><Prog value={g.level >= MAX_LEVEL ? 1 : (g.xp - lo) / (hi - lo)} /></div>
        <div style={muted}>{g.level >= MAX_LEVEL ? "Максимальный уровень!" : `${g.xp - lo} / ${hi - lo} XP до уровня ${g.level + 1}`}</div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {tile("🔥", g.streak, "дней подряд", PAL.orange[0])}
        {tile("💎", g.xp, "всего XP", PAL.blue[0])}
        {tile("📅", streakRaw.total, "дней занятий", PAL.purple[0])}
        {tile("✅", sessions, "упражнений", PAL.green[0])}
      </div>
      {h2("🏆 Рекорды")}
      <div style={{ ...card, gap: 0, padding: "4px 18px" }}>
        {BEST_ROWS.map(([k, nm, f]: [string, string, (v: number) => string], i: number) => { const v = read<number>(k, 0); return <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderTop: i ? `2px solid ${t.border.subtle}` : "none", fontWeight: 700 }}><span>{nm}</span><span style={{ color: v ? t.text.primary : t.text.tertiary }}>{v ? f(v) : "—"}</span></div>; })}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderTop: `2px solid ${t.border.subtle}`, fontWeight: 700 }}><span>⚡ Быстрый показ</span><span>{maxes.wpm ? `${maxes.wpm} слов/мин` : "—"}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderTop: `2px solid ${t.border.subtle}`, fontWeight: 700 }}><span>🧠 N-назад</span><span>{maxes.nback ? `уровень ${maxes.nback}` : "—"}</span></div>
      </div>
      {h2(`📜 Выученные стихи · ${g.poems.filter((x: string) => POEMS.some((q: Poem) => q.t === x)).length}/${POEMS.length}`)}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {POEMS.map((q: Poem) => { const ok = g.poems.includes(q.t); return <div key={q.t} style={{ padding: "8px 12px", borderRadius: 14, border: `2px solid ${ok ? PAL.purple[0] : t.border.subtle}`, background: ok ? t.bg.elevated : "transparent", color: ok ? t.text.primary : t.text.tertiary, fontSize: 13, fontWeight: 800 }}>{ok ? "✓ " : ""}{q.t}</div>; })}
      </div>
      {h2(`🎖️ Достижения · ${ach.length}/${ACHS.length}`)}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
        {ACHS.map((a: Ach) => { const ok = ach.includes(a.id); return (
          <div key={a.id} style={{ border: `2px solid ${ok ? PAL.yellow[0] : t.border.subtle}`, boxShadow: ok ? `0 4px 0 ${PAL.yellow[1]}` : "none", background: t.bg.elevated, borderRadius: 18, padding: "12px 6px", textAlign: "center", display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
            <span style={{ fontSize: 32, filter: ok ? "none" : "grayscale(1)", opacity: ok ? 1 : 0.35 }}>{a.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 900, lineHeight: "14px", color: ok ? t.text.primary : t.text.tertiary }}>{a.name}</span>
            <span style={{ fontSize: 10.5, lineHeight: "13px", color: t.text.tertiary }}>{a.desc}</span>
          </div>); })}
      </div>
      {h2("⚙️ Настройки")}
      <div style={{ ...card, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span style={{ fontWeight: 800 }}>{g.mute ? "🔇" : "🔊"} Звуки</span>
          <button onClick={() => { g.setMute(!g.mute); buzz(10); }} aria-label="Звуки" style={{ width: 58, height: 34, borderRadius: 99, border: "none", background: g.mute ? t.border.default : PAL.green[0], position: "relative", cursor: "pointer", transition: "background .2s" }}>
            <span style={{ position: "absolute", top: 4, left: g.mute ? 4 : 28, width: 26, height: 26, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 2px 4px rgba(0,0,0,.2)" }} />
          </button>
        </div>
        <Btn3D light full label={tips ? "Скрыть советы" : "💡 Что говорит наука"} col={PAL.blue} onClick={() => setTips(!tips)} />
        {tips ? <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{TIPS.map(([ic, ttl, d, ev]: [string, string, string, string]) => (
          <div key={ttl} className="mt-fade" style={{ border: `2px solid ${t.border.subtle}`, borderRadius: 16, padding: 12 }}>
            <div style={{ fontWeight: 900 }}>{ic} {ttl}</div><div style={{ fontSize: 14, color: t.text.secondary, lineHeight: "20px" }}>{d}</div><div style={{ fontSize: 12, color: t.text.tertiary, fontWeight: 700, marginTop: 4 }}>{ev}</div>
          </div>))}</div> : null}
        {!confirm ? <Btn3D light full label="Сбросить прогресс" col={PAL.red} onClick={() => setConfirm(true)} /> : (
          <div className="mt-shake" style={{ display: "flex", flexDirection: "column", gap: 10, padding: 12, borderRadius: 16, background: t.fill.dangerSubtle }}>
            <div style={{ fontWeight: 800, color: t.text.danger }}>Точно сбросить? Удалятся XP, уровень, серия, рекорды, стихи и достижения. Отменить будет нельзя.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn3D label="Да, сбросить" col={PAL.red} onClick={() => { Object.keys(localStorage).filter((k: string) => k.startsWith("rm:")).forEach((k: string) => localStorage.removeItem(k)); localStorage.setItem("rm:migrated2", "true"); window.location.reload(); }} />
              <Btn3D light label="Отмена" onClick={() => setConfirm(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function itemOf(id: string): Item {
  if (id.startsWith("poem")) return { id, icon: "📜", name: "Стихи наизусть", short: "" };
  return READ_ITEMS.concat(MEM_ITEMS, MIND_ITEMS).find((x: Item) => x.id === id) || READ_ITEMS[0];
}
function descOf(id: string) { return id.startsWith("poem") ? "Пять шагов: читаем, первые буквы, пропуски, по строкам, проверка. Учи одно стихотворение несколько дней." : DESC[id]; }
function renderEx(id: string, learned: string[]): ReactNode {
  if (id.startsWith("poem")) {
    const i = id.startsWith("poem:") ? Number(id.slice(5)) : Math.max(0, POEMS.findIndex((p: Poem) => !learned.includes(p.t)));
    return <PoemTrainer initial={i} />;
  }
  switch (id) {
    case "rsvp": return <Rsvp />; case "schulte": return <Schulte />; case "periph": return <Periph />; case "test": return <ReadTest />;
    case "pairs": return <Pairs />; case "number": return <NumberGame />; case "simon": return <Simon />; case "words": return <WordsGame />;
    case "change": return <Change />; case "nback": return <NBack />; case "faces": return <FacesGame />; case "loci": return <Loci />;
    case "stroop": return <Stroop />; case "math": return <MathGame />; default: return <Reaction />;
  }
}
function planIdxFor(id: string): number[] {
  return PLAN_GO.map(([, pid]: [Tab, string], i: number) => (pid === id || (pid === "poem" && id.startsWith("poem")) || (pid === "pairs" && id === "faces") ? i : -1)).filter((i: number) => i >= 0);
}

function ExScreen(p: { id: string; plan: number; walk: boolean; onClose: () => void; onDone: () => void }) {
  const { t } = useS();
  const g = useGame();
  const it = itemOf(p.id);
  const [wig, setWig] = useState(0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button aria-label="Закрыть" onClick={p.onClose} className="mt-press" style={{ width: 40, height: 40, borderRadius: 12, border: "none", background: "transparent", fontSize: 26, color: t.text.tertiary, cursor: "pointer", fontWeight: 900 }}>✕</button>
        <div style={{ flex: 1 }}>{p.plan >= 0 ? <div style={{ fontSize: 13, fontWeight: 900, color: PAL.blue[1] }}>📋 {p.walk ? `Задание ${p.plan + 1} из ${PLAN.length}` : "Задание дня"} · {PLAN[p.plan][0]}</div> : null}<div style={{ fontSize: 13, fontWeight: 800, color: t.text.tertiary }}>{p.plan >= 0 ? PLAN[p.plan][3] : "Тренировка"}</div></div>
      </div>
      <div onPointerDown={() => { session.presses++; }}>
        <GameCard item={it} desc={descOf(p.id)}>{renderEx(p.id, g.poems)}</GameCard>
      </div>
      <div style={{ height: 90 }} />
      {createPortal(<div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 40, background: t.bg.base, borderTop: `2px solid ${t.border.subtle}`, padding: "12px 16px calc(12px + env(safe-area-inset-bottom))" }}>
        <div key={wig} className={wig ? "mt-shake" : ""} style={{ maxWidth: 640, margin: "0 auto" }}>
          <Btn3D full big label="Завершить ✓" onClick={() => {
            if (session.presses < 2 && session.good + session.bad === 0) { setWig(wig + 1); toast("Сначала попробуй упражнение 🙂"); return; }
            p.onDone();
          }} />
        </div>
      </div>, document.body)}
    </div>
  );
}

function ResultScreen(p: { r: Result; next: string; onNext: () => void }) {
  const { t, card } = useS();
  const g = useGame();
  const r = p.r;
  useEffect(() => { play("win"); buzz([20, 60, 20]); if (r.stars >= 3 || r.goalNow) fireConfetti(); const id = setTimeout(() => play("xp"), 700); return () => clearTimeout(id); }, []);
  const title = r.stars >= 3 ? "Великолепно!" : r.stars === 2 ? "Отличная работа!" : "Хорошее начало!";
  const tile = (l: string, v: ReactNode, col: readonly [string, string], d: number) => (
    <div className="mt-pop" style={{ animationDelay: `${d}ms`, flex: 1, borderRadius: 18, border: `2px solid ${col[0]}`, overflow: "hidden", textAlign: "center" }}>
      <div style={{ background: col[0], color: "#fff", fontSize: 11.5, fontWeight: 900, padding: "5px 0", letterSpacing: 0.6, textTransform: "uppercase" }}>{l}</div>
      <div style={{ padding: "12px 4px", fontSize: 22, fontWeight: 900, color: col[1], background: t.bg.elevated }}>{v}</div>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", textAlign: "center", paddingTop: 10, position: "relative" }}>
      <div style={{ position: "relative" }}>
        <Mascot size={140} mood="happy" cls="mt-jump" />
        <div className="mt-fly" style={{ position: "absolute", left: "50%", top: 10, fontSize: 26, fontWeight: 900, color: PAL.yellow[1], whiteSpace: "nowrap" }}>+{r.xp} XP</div>
      </div>
      <div className="mt-pop" style={{ fontSize: 30, fontWeight: 900, color: PAL.green[1] }}>{title}</div>
      <Stars n={r.stars} size={40} anim />
      <div style={{ display: "flex", gap: 10, width: "100%" }}>
        {tile("Опыт", `+${r.xp}`, PAL.yellow, 200)}
        {tile("Точность", r.acc === null ? "—" : `${Math.round(r.acc * 100)}%`, PAL.green, 350)}
        {tile("Цель дня", `${Math.min(g.dayXp, DAILY_GOAL)}/${DAILY_GOAL}`, PAL.blue, 500)}
      </div>
      {r.goalNow ? <div className="mt-pop" style={{ ...card, width: "100%", boxSizing: "border-box", flexDirection: "row", alignItems: "center", gap: 10, borderColor: PAL.green[0] }}><span style={{ fontSize: 30 }}>🎯</span><span style={{ fontWeight: 900 }}>Цель дня выполнена!</span></div> : null}
      {r.achs.map((a: Ach, i: number) => (
        <div key={a.id} className="mt-pop" style={{ ...card, animationDelay: `${700 + i * 200}ms`, width: "100%", boxSizing: "border-box", flexDirection: "row", alignItems: "center", gap: 12, borderColor: PAL.yellow[0], boxShadow: `0 4px 0 ${PAL.yellow[1]}`, textAlign: "left" }}>
          <span className="mt-wiggle" style={{ fontSize: 36 }}>{a.icon}</span>
          <div><div style={{ fontSize: 12, fontWeight: 900, color: PAL.yellow[1], textTransform: "uppercase" }}>Новое достижение</div><div style={{ fontWeight: 900 }}>{a.name}</div><div style={{ fontSize: 13, color: t.text.secondary }}>{a.desc}</div></div>
        </div>
      ))}
      <div style={{ height: 90 }} />
      {createPortal(<div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 40, background: t.bg.base, borderTop: `2px solid ${t.border.subtle}`, padding: "12px 16px calc(12px + env(safe-area-inset-bottom))" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}><Btn3D full big label={p.next} onClick={p.onNext} /></div>
      </div>, document.body)}
    </div>
  );
}

function LevelUp(p: { level: number; onClose: () => void }) {
  useEffect(() => { play("level"); buzz([30, 50, 30, 50, 80]); fireConfetti(); }, []);
  return (
    <div className="mt-fadein" style={{ position: "fixed", inset: 0, zIndex: 60, background: `linear-gradient(160deg, ${PAL.purple[0]}, ${PAL.blue[0]})`, color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: "env(safe-area-inset-top) 24px env(safe-area-inset-bottom)", textAlign: "center" }}>
      <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 2, opacity: 0.9 }}>НОВЫЙ УРОВЕНЬ!</div>
      <div className="mt-levelbadge" style={{ width: 150, height: 150, borderRadius: "50%", background: PAL.yellow[0], boxShadow: `0 10px 0 ${PAL.yellow[1]}, 0 0 0 10px rgba(255,255,255,.25)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 72, fontWeight: 900, color: "#7A4A00" }}>{p.level}</div>
      <Mascot size={110} mood="wow" cls="mt-jump" />
      <div style={{ fontSize: 18, fontWeight: 800, maxWidth: 320, lineHeight: "24px" }}>Мозг прокачан до уровня {p.level}. Продолжай в том же духе!</div>
      <div style={{ width: "100%", maxWidth: 360 }}><Btn3D full big light col={PAL.purple} label="Ура! Дальше" onClick={p.onClose} /></div>
    </div>
  );
}

export default function App() {
  const { t } = useS();
  const [tab, setTab] = useState<TabId>("home");
  const [view, setView] = useState<View>({ kind: "tab" });
  const [lvl, setLvl] = useState<number | null>(null);
  const g = useGame();
  useEffect(() => { migrate(); checkAchs(PLAN.length); }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [tab, view]);
  const openEx = (id: string, plan: number, walk: boolean) => { resetSession(); setView({ kind: "ex", id, plan, walk }); };
  const goPlan = (i: number, walk: boolean) => openEx(PLAN_GO[i][1], i, walk);
  const finish = (id: string, plan: number, walk: boolean) => {
    const idx = planIdxFor(id); if (plan >= 0 && !idx.includes(plan)) idx.push(plan);
    const r = complete(id, PLAN.length, idx);
    setView({ kind: "result", r, plan, walk });
  };
  const after = (plan: number, walk: boolean) => {
    if (walk && plan >= 0) {
      const done = read<number[]>("plan:" + today(), []);
      const nx = PLAN.findIndex((_: unknown, i: number) => i > plan && !done.includes(i));
      if (nx >= 0) { goPlan(nx, true); return; }
    }
    setView({ kind: "tab" });
  };
  const vkey = view.kind === "tab" ? "tab-" + tab : view.kind === "ex" ? "ex-" + view.id + view.plan : "res";
  const unit = UNITS.find((u: Unit) => u.id === tab);
  const inTab = view.kind === "tab";
  return (
    <div style={{ fontFamily: t.font.family, color: t.text.primary, background: t.bg.base, minHeight: "100vh" }}>
      <style>{CSS}</style>
      <Confetti />
      <Toast />
      {inTab ? <TopBar onProfile={() => setTab("profile")} /> : null}
      <div style={{ maxWidth: 640, margin: "0 auto", boxSizing: "border-box", padding: inTab ? "calc(env(safe-area-inset-top) + 74px) 16px calc(env(safe-area-inset-bottom) + 96px)" : "calc(env(safe-area-inset-top) + 12px) 16px 24px" }}>
        <div key={vkey} className="mt-slide">
          {view.kind === "ex" ? <ExScreen id={view.id} plan={view.plan} walk={view.walk} onClose={() => setView({ kind: "tab" })} onDone={() => finish(view.id, view.plan, view.walk)} /> : null}
          {view.kind === "result" ? (() => { const v = view; const done = read<number[]>("plan:" + today(), []); const more = v.walk && PLAN.some((_: unknown, i: number) => i > v.plan && !done.includes(i));
            return <ResultScreen r={v.r} next={more ? "Следующее задание →" : "Продолжить"} onNext={() => { if (v.r.levelUp) setLvl(v.r.levelUp); after(v.plan, v.walk); }} />; })() : null}
          {inTab && tab === "home" ? <Home onGo={goPlan} onOpen={(id: string) => openEx(id, -1, false)} /> : null}
          {inTab && unit ? <UnitTab u={unit} onOpen={(id: string) => openEx(id, -1, false)} /> : null}
          {inTab && tab === "profile" ? <Profile /> : null}
        </div>
      </div>
      {inTab ? <BottomNav tab={tab} onTab={(x: TabId) => { setTab(x); }} /> : null}
      {lvl ? <LevelUp level={lvl} onClose={() => setLvl(null)} /> : null}
      <span style={{ display: "none" }}>{g.level}</span>
    </div>
  );
}
