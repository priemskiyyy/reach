import { cva } from "class-variance-authority";

export const iconTileStyles = cva(
  "inline-flex shrink-0 items-center justify-center bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
  {
    variants: {
      size: {
        regular: "size-9 rounded-xl",
        small: "size-8 rounded-lg",
      },
    },
    defaultVariants: { size: "regular" },
  },
);
