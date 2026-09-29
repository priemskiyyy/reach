import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, relative, resolve } from "node:path";

const OUTPUT = resolve(".artifacts/packages");
const CONSUMER = join(OUTPUT, "consumer");

// The publish workflow uploads this directory and publishes these exact tarballs.
const RELEASE = resolve(".artifacts/release");

const PACKAGES = [
  "packages/core",
  "packages/adapters/browser",
  "packages/adapters/netinfo",
  "packages/adapters/expo-network",
  "packages/adapters/http",
  "packages/react",
  "packages/solid",
  "packages/tanstack-query",
];

// What each published entry exports at runtime, and nothing more.
const RUNTIME_EXPORTS = {
  "@priemskiyyy/reach": [
    "Reach",
    "ReachError",
    "UNKNOWN_NETWORK_STATE",
    "all",
    "any",
    "createCondition",
    "not",
  ],
  "@priemskiyyy/reach/mock": [
    "createMockEndpoint",
    "createMockNetwork",
    "createTestClock",
    "observed",
  ],
  "@priemskiyyy/reach/testing": ["testNetworkAdapter"],
  "@priemskiyyy/reach-browser": ["browser"],
  "@priemskiyyy/reach-netinfo": ["netInfo"],
  "@priemskiyyy/reach-expo-network": ["expoNetwork"],
  "@priemskiyyy/reach-http": ["http"],
  "@priemskiyyy/reach-tanstack-query": ["toOnlineEventListener"],
};

const run = (command, args, cwd) =>
  execFileSync(command, args, { cwd, encoding: "utf8", stdio: "pipe" });

rmSync(OUTPUT, { recursive: true, force: true });
rmSync(RELEASE, { recursive: true, force: true });
mkdirSync(CONSUMER, { recursive: true });

const tarballs = PACKAGES.map((directory) => {
  const { name } = JSON.parse(
    readFileSync(join(directory, "package.json"), "utf8"),
  );

  const destination = join(RELEASE, name);

  mkdirSync(destination, { recursive: true });
  run("pnpm", ["pack", "--pack-destination", destination], directory);

  const [file, ...others] = readdirSync(destination);

  assert.equal(others.length, 0, `${name} packs once.`);

  const digest = createHash("sha256")
    .update(readFileSync(join(destination, file)))
    .digest("hex");

  writeFileSync(join(destination, "SHA256SUMS"), `${digest}  ${file}\n`);

  return { name, path: join(destination, file) };
});

// No native SDK, React or Query is installed: each package must stand on its own.
writeFileSync(
  join(CONSUMER, "package.json"),
  JSON.stringify(
    {
      name: "reach-packed-consumer",
      private: true,
      type: "module",
      dependencies: Object.fromEntries(
        tarballs.map(({ name, path }) => [
          name,
          `file:${relative(CONSUMER, path)}`,
        ]),
      ),
    },
    null,
    2,
  ),
);

run(
  "npm",
  [
    "install",
    "--legacy-peer-deps",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    "--no-package-lock",
  ],
  CONSUMER,
);

// T145 T156: every entry imports in Node without browser globals or native peers.
writeFileSync(
  join(CONSUMER, "imports.mjs"),
  `import assert from "node:assert/strict";

const expected = ${JSON.stringify(RUNTIME_EXPORTS, null, 2)};

assert.equal(typeof globalThis.window, "undefined");
assert.equal(typeof globalThis.document, "undefined");

for (const [name, exports] of Object.entries(expected)) {
  const module = await import(name);

  assert.deepEqual(Object.keys(module).sort(), [...exports].sort(), name);
}

const { Reach } = await import("@priemskiyyy/reach");
const { browser } = await import("@priemskiyyy/reach-browser");

const network = new Reach({ adapter: browser() });

assert.equal(network.state.get().connection.status, "unknown");
// Node has no window, so the browser source is unavailable, never a failure.
await network.start().ready;
assert.equal(
  network.state.get().evidence["connection.status"].reason,
  "source-unavailable",
);
network.dispose();
`,
);

run("node", ["imports.mjs"], CONSUMER);

// The declarations resolve through each package's exports, as a bundler's would.
writeFileSync(
  join(CONSUMER, "types.ts"),
  `import { all, Reach } from "@priemskiyyy/reach";
import type { NetworkState } from "@priemskiyyy/reach";
import { createMockNetwork } from "@priemskiyyy/reach/mock";
import { testNetworkAdapter } from "@priemskiyyy/reach/testing";
import { browser } from "@priemskiyyy/reach-browser";
import { expoNetwork } from "@priemskiyyy/reach-expo-network";
import { http } from "@priemskiyyy/reach-http";
import { netInfo } from "@priemskiyyy/reach-netinfo";
import type { ReachNetwork } from "@priemskiyyy/reach-react";
import { toOnlineEventListener } from "@priemskiyyy/reach-tanstack-query";

const network = new Reach({
  adapter: createMockNetwork().adapter,
  endpoints: {
    api: http({ request: async () => ({ ready: true }), test: ({ ready }) => ready, staleAfter: 1_000 }),
  },
});

export const available = all(network.endpoint("api").available);
export const state: NetworkState = network.state.get();
export const provided: ReachNetwork = network;
export const listener = toOnlineEventListener(network.condition({ internet: "online" }));
export const adapters = [browser(), netInfo, expoNetwork, testNetworkAdapter];

// @ts-expect-error A consumer sees the same literal endpoint names.
network.endpoint("missing");
`,
);

writeFileSync(
  join(CONSUMER, "tsconfig.json"),
  JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        lib: ["ES2022", "DOM"],
        module: "ESNext",
        moduleResolution: "Bundler",
        strict: true,
        exactOptionalPropertyTypes: true,
        skipLibCheck: true,
        noEmit: true,
        types: [],
      },
      include: ["types.ts"],
    },
    null,
    2,
  ),
);

run(resolve("node_modules/.bin/tsc"), ["-p", "tsconfig.json"], CONSUMER);

console.log(
  `Packed ${tarballs.length} packages, imported ${Object.keys(RUNTIME_EXPORTS).length} entries without native peers, and typechecked a consumer. Release artifacts are in .artifacts/release.`,
);
