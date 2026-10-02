import { expect, test } from "vitest";

import { DOCUMENTED_LIMITS } from "src/world/documentedLimits.fixture";
import { generateScript } from "src/world/generateScript.fixture";
import { minimizeScript } from "src/world/minimizeScript.fixture";
import { runScript } from "src/world/runScript.fixture";
import type { Step } from "src/world/types/Step";
import type { Violation } from "src/world/types/Violation";
import {
  IGNORED,
  REPLAY,
  RUNS,
  SEED,
  STEPS,
  SURVEY,
} from "src/world/worldSettings.fixture";

// A fuzz whose oracle is the world: see README.md in this folder. A fixed seed
// makes the default run the same on every machine; `pnpm test:world` runs many more.

type Found = {
  seed: number;
  script: Step[];
  violation: Violation;
  count: number;
};

const skipped = DOCUMENTED_LIMITS.map(({ kind }) => kind).concat(IGNORED);

test("the world fuzz: no decision or result contradicts what the fake world did", async () => {
  if (REPLAY !== "") {
    console.info(JSON.stringify(await runScript(JSON.parse(REPLAY)), null, 2));

    return;
  }

  const classes = new Map<string, Found>();

  for (let run = 0; run < RUNS; run += 1) {
    const script = generateScript(SEED + run, STEPS);

    for (const violation of await runScript(script)) {
      if (!SURVEY && skipped.includes(violation.kind)) {
        continue;
      }

      const known = classes.get(violation.kind);

      if (known !== undefined) {
        known.count += 1;

        continue;
      }

      classes.set(violation.kind, {
        seed: SEED + run,
        script,
        violation,
        count: 1,
      });
    }
  }

  const failures: string[] = [];

  for (const [kind, { seed, script, violation, count }] of classes) {
    const minimal = await minimizeScript(script, kind);

    failures.push(
      `${kind} in ${count} of ${RUNS} scripts (first seed ${seed}, step ${violation.step}): ${violation.detail}\n  replay: ${JSON.stringify(minimal)}`,
    );
  }

  if (SURVEY) {
    console.info(failures.join("\n"));

    return;
  }

  expect(failures).toEqual([]);
}, 900_000);
