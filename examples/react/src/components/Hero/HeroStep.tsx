import type React from "react";

type HeroStepProps = { number: number; title: string; description: string };

export const HeroStep: React.FunctionComponent<HeroStepProps> = ({
  number,
  title,
  description,
}) => (
  <li className="flex gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-sm ring-1 ring-sky-200/70 dark:bg-slate-900/70 dark:ring-sky-900/50">
    <span
      aria-hidden="true"
      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sky-600 font-mono text-sm font-semibold text-white dark:bg-sky-400 dark:text-slate-950"
    >
      {number}
    </span>
    <span className="flex flex-col gap-0.5">
      <span className="font-semibold">{title}</span>
      <span className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {description}
      </span>
    </span>
  </li>
);
