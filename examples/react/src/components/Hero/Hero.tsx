import { Camera, Flask } from "@phosphor-icons/react";
import type React from "react";

import { buttonStyles } from "example-shared/ui/styles/buttonStyles";
import { HeroStep } from "src/components/Hero/HeroStep";
import { scrollToElement } from "src/utils/scrollToElement";

export const Hero: React.FunctionComponent = () => (
  <section
    aria-label="Overview"
    className="grid gap-6 rounded-3xl border border-sky-200 bg-linear-to-br from-sky-50 via-sky-50/70 to-teal-50/60 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center dark:border-sky-900/60 dark:from-sky-950/30 dark:via-slate-950 dark:to-teal-950/20"
  >
    <div className="flex flex-col gap-4">
      <p className="font-mono text-sm font-semibold tracking-widest text-sky-700 uppercase dark:text-sky-300">
        A Reach demo
      </p>
      <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
        Online, offline, or honestly unknown
      </h2>
      <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-400">
        Darkroom is a small photo app that backs up to your own API. Reach tells
        it what the network is, on what evidence, and whether the API answers,
        and says unknown whenever nothing can tell. The phone and the API run
        inside this page, so nothing leaves your browser.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => scrollToElement("app")}
          className={buttonStyles({ variant: "primary" })}
        >
          <Camera aria-hidden="true" size={16} weight="bold" />
          Take a photo
        </button>
        <button
          type="button"
          onClick={() => scrollToElement("lab")}
          className={buttonStyles({ variant: "ghost" })}
        >
          <Flask aria-hidden="true" size={16} weight="bold" />
          Open the lab
        </button>
      </div>
    </div>
    <ol aria-label="How to use this page" className="flex flex-col gap-2.5">
      <HeroStep
        number={1}
        title="Take a photo"
        description="It backs up on its own while your API is available and the connection is neither metered nor in Low Data Mode."
      />
      <HeroStep
        number={2}
        title="Read the evidence"
        description="Every fact names what it rests on. A fact nothing can tell is unknown, never false and never offline."
      />
      <HeroStep
        number={3}
        title="Break the network"
        description="Go cellular, join a hotel Wi-Fi or take your API down in the lab. Every decision says why it was made."
      />
    </ol>
  </section>
);
