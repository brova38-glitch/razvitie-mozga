import { useEffect, useState } from "react";

export type Theme = {
  kind: "light" | "dark";
  bg: { base: string; elevated: string; subtle: string };
  border: { default: string; strong: string; subtle: string };
  text: { primary: string; secondary: string; tertiary: string; accent: string; danger: string; success: string; warning: string; onColor: string };
  fill: { accentSubtle: string; dangerSubtle: string; successSubtle: string; warningSubtle: string };
  dataviz: { categorical: string[]; negative: string; other: string };
  font: { family: string; mono: string };
};

const font = { family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' };

export const LIGHT: Theme = {
  kind: "light",
  bg: { base: "#f6f7fb", elevated: "#ffffff", subtle: "#eceef5" },
  border: { default: "#d5d9e4", strong: "#a9b0c2", subtle: "#e4e7ef" },
  text: { primary: "#151826", secondary: "#4b5165", tertiary: "#7c8296", accent: "#5b4cf0", danger: "#d23c4b", success: "#14895a", warning: "#b86e00", onColor: "#ffffff" },
  fill: { accentSubtle: "#e8e5ff", dangerSubtle: "#fde6e9", successSubtle: "#dcf5e9", warningSubtle: "#fff1d6" },
  dataviz: { categorical: ["#6a5cff", "#ff6fa8", "#18b4c9", "#ffb020", "#2fbf71", "#9b6bff"], negative: "#e5484d", other: "#9aa0b2" },
  font,
};

export const DARK: Theme = {
  kind: "dark",
  bg: { base: "#0d0f17", elevated: "#171a26", subtle: "#1f2333" },
  border: { default: "#30364a", strong: "#4a5270", subtle: "#252a3b" },
  text: { primary: "#f2f3f8", secondary: "#b3b8ca", tertiary: "#7e849a", accent: "#a69dff", danger: "#ff6b78", success: "#4fd99a", warning: "#ffbe55", onColor: "#ffffff" },
  fill: { accentSubtle: "#2a2550", dangerSubtle: "#3f1d24", successSubtle: "#173b2b", warningSubtle: "#3d2e12" },
  dataviz: { categorical: ["#7b6dff", "#ff6fa8", "#22c3d8", "#ffb020", "#36cf7f", "#a47dff"], negative: "#ff5d63", other: "#6b7186" },
  font,
};

const mq = () => window.matchMedia("(prefers-color-scheme: dark)");

export function useGrokTheme(): Theme {
  const [dark, setDark] = useState<boolean>(() => mq().matches);
  useEffect(() => {
    const m = mq();
    const on = (e: MediaQueryListEvent) => setDark(e.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return dark ? DARK : LIGHT;
}
