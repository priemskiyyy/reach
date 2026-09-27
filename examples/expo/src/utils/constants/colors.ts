import type { Tone } from "example-shared/ui/types/Tone";

export const COLORS = {
  background: "#f8fafc",
  surface: "#ffffff",
  sunken: "#f1f5f9",
  border: "#e2e8f0",
  text: "#0f172a",
  body: "#334155",
  muted: "#64748b",
  faint: "#94a3b8",
  accent: "#0284c7",
  accentSoft: "#f0f9ff",
  accentBorder: "#7dd3fc",
  accentText: "#075985",
  onAccent: "#ffffff",
};

export const TONE_COLORS: Record<Tone, string> = {
  neutral: "#94a3b8",
  positive: "#10b981",
  warning: "#eab308",
  danger: "#f43f5e",
  accent: "#0ea5e9",
  info: "#6366f1",
};
