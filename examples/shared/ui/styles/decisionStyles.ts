import { cva } from "class-variance-authority";

export const decisionStyles = cva(
  "flex min-w-0 flex-col items-start gap-1.5 rounded-lg border p-2.5 transition",
  {
    variants: {
      current: {
        true: "border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/40 dark:border-sky-400 dark:bg-sky-950/30",
        false: "border-slate-200 opacity-60 dark:border-slate-800",
      },
    },
  },
);
