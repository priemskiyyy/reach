import { cva } from "class-variance-authority";

export const buttonStyles = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-slate-900 text-white shadow-sm hover:bg-slate-700 dark:bg-sky-400 dark:text-slate-950 dark:hover:bg-sky-300",
        secondary:
          "border border-slate-300 bg-white shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800",
        ghost:
          "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
      },
      pressed: {
        true: "border-sky-500 text-sky-800 ring-2 ring-sky-500/60 dark:border-sky-400 dark:text-sky-200",
        false: "",
      },
      size: {
        regular: "h-10 px-4 text-sm",
        small: "h-8 px-2.5 text-sm",
      },
    },
    defaultVariants: { variant: "secondary", pressed: false, size: "regular" },
  },
);
