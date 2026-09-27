import { cva } from "class-variance-authority";

export const navLinkStyles = cva(
  "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500",
  {
    variants: {
      current: {
        true: "bg-slate-900 text-white dark:bg-sky-400 dark:text-slate-950",
        false:
          "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
      },
    },
  },
);
