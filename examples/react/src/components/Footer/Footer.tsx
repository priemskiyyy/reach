import type React from "react";

export const Footer: React.FunctionComponent = () => (
  <footer className="border-t border-slate-200/70 dark:border-slate-800">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-8 text-sm text-slate-500 sm:px-6">
      <span>
        The phone and your API run inside this page, so nothing leaves your
        browser. Switch the source to This browser to read your real network.
      </span>
      <a
        href="https://github.com/priemskiyyy/reach"
        className="underline-offset-2 hover:underline sm:ml-auto"
      >
        Reach on GitHub
      </a>
    </div>
  </footer>
);
