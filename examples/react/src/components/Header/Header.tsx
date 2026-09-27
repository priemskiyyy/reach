import { Aperture, ArrowCounterClockwise } from "@phosphor-icons/react";
import type React from "react";

import type { DarkroomRuntime } from "example-shared/darkroom/runtime/types/DarkroomRuntime";
import { buttonStyles } from "example-shared/ui/styles/buttonStyles";
import { ReachStatusBadge } from "src/components/Badge/ReachStatusBadge";
import { IconTile } from "src/components/IconTile/IconTile";
import { SectionNav } from "src/components/Section/SectionNav";

type HeaderProps = { runtime: DarkroomRuntime };

// Nothing outlives the page, so reloading it is a complete reset.
const handleResetPress = () => {
  window.location.reload();
};

export const Header: React.FunctionComponent<HeaderProps> = ({ runtime }) => (
  <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-slate-50/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
      <div className="mr-auto flex min-w-0 items-center gap-2">
        <IconTile icon={Aperture} size="small" />
        <h1 className="text-lg font-semibold">Darkroom</h1>
        <ReachStatusBadge runtime={runtime} />
      </div>
      <div className="order-last w-full min-w-0 lg:order-none lg:w-auto">
        <SectionNav />
      </div>
      <button
        type="button"
        onClick={handleResetPress}
        className={buttonStyles({ variant: "ghost", size: "small" })}
      >
        <ArrowCounterClockwise aria-hidden="true" size={14} weight="bold" />
        Reset demo
      </button>
    </div>
  </header>
);
