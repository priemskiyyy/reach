import { cva } from "class-variance-authority";

export const segmentStyles = cva(
  "inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      selected: {
        true: "bg-white text-slate-900 shadow-sm ring-2 ring-sky-500/60 dark:bg-slate-950 dark:text-slate-100",
        false:
          "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
      },
    },
  },
);
