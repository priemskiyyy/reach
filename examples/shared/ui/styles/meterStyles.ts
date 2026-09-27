import { cva } from "class-variance-authority";

export const meterStyles = cva("h-2 flex-1 rounded-full transition-colors", {
  variants: {
    filled: {
      true: "bg-emerald-500",
      false: "bg-slate-200 dark:bg-slate-800",
    },
  },
});
