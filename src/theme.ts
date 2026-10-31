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

// Bright game palette: [main, darker "3D" edge]
export const PAL = {
  green: ["#2FC85A", "#1E9C42"],
  blue: ["#2E9BF0", "#1A76C2"],
  purple: ["#A35BF0", "#7A38C4"],
  orange: ["#FF8A1F", "#D96A00"],
  yellow: ["#FFC531", "#E0A100"],
  pink: ["#FF5C93", "#D23A6F"],
  red: ["#FF4B4B", "#D42F2F"],
} as const;

const font = { family: '"Nunito", ui-rounded, "SF Pro Rounded", -apple-system, "Segoe UI", Roboto, sans-serif', mono: 'ui-monospace, SFMono-Regular, Menlo, monospace' };

export const LIGHT: Theme = {
  kind: "light",
  bg: { base: "#F7F9FC", elevated: "#FFFFFF", subtle: "#EEF2F7" },
  border: { default: "#DCE3EC", strong: "#B9C4D3", subtle: "#E6EBF2" },
  text: { primary: "#1F2A37", secondary: "#56657A", tertiary: "#8A97A8", accent: "#1A76C2", danger: "#E03A3A", success: "#1E9C42", warning: "#C77700", onColor: "#FFFFFF" },
  fill: { accentSubtle: "#E3F1FD", dangerSubtle: "#FFE7E7", successSubtle: "#E1F8E7", warningSubtle: "#FFF3D6" },
  dataviz: { categorical: [PAL.green[0], PAL.blue[0], PAL.purple[0], PAL.orange[0], PAL.yellow[0], PAL.pink[0]], negative: PAL.red[0], other: "#9AA6B6" },
  font,
};

export const DARK: Theme = {
  kind: "dark",
  bg: { base: "#121A24", elevated: "#1B2532", subtle: "#243142" },
  border: { default: "#33445A", strong: "#4C6280", subtle: "#2A394C" },
  text: { primary: "#F2F6FA", secondary: "#B4C0CE", tertiary: "#7F8FA3", accent: "#5DB4FF", danger: "#FF6B6B", success: "#4BDB75", warning: "#FFC94D", onColor: "#FFFFFF" },
  fill: { accentSubtle: "#173452", dangerSubtle: "#46202A", successSubtle: "#173E26", warningSubtle: "#433410" },
  dataviz: { categorical: [PAL.green[0], PAL.blue[0], PAL.purple[0], PAL.orange[0], PAL.yellow[0], PAL.pink[0]], negative: PAL.red[0], other: "#6B7A8F" },
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
