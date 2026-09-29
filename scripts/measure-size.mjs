import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { rolldown } from "rolldown";

// Each entry of the built packages, bundled as a consumer would get it:
// minified, peers external, and the gzip size is what a budget reviews. An
// adapter imports the core by name, which resolves to the same built file, so
// a pair is measured once.
const packages = fileURLToPath(new URL("../packages/", import.meta.url));

const CORE = `${packages}core/dist/index.js`;

const ENTRIES = [
  { name: "core", files: [CORE], budget: 12 * 1024 },
  {
    name: "core + browser",
    files: [CORE, `${packages}adapters/browser/dist/index.js`],
    budget: 13 * 1024,
  },
  {
    name: "core + netinfo",
    files: [CORE, `${packages}adapters/netinfo/dist/index.js`],
    budget: 13 * 1024,
  },
  {
    name: "core + expo-network",
    files: [CORE, `${packages}adapters/expo-network/dist/index.js`],
    budget: 13 * 1024,
  },
  {
    name: "core + http",
    files: [CORE, `${packages}adapters/http/dist/index.js`],
    budget: 12.5 * 1024,
  },
  {
    name: "react",
    files: [`${packages}react/dist/index.js`],
    budget: 1024,
    external: ["@priemskiyyy/reach"],
  },
  {
    name: "solid",
    files: [`${packages}solid/dist/index.js`],
    budget: 1024,
    external: ["@priemskiyyy/reach"],
  },
  {
    name: "tanstack-query",
    files: [`${packages}tanstack-query/dist/index.js`],
    budget: 512,
    external: ["@priemskiyyy/reach"],
  },
  { name: "mock", files: [`${packages}core/dist/mock.js`], budget: null },
  { name: "testing", files: [`${packages}core/dist/testing.js`], budget: null },
];

const PEERS = ["react", "react-dom", "react/jsx-runtime", "solid-js"];

const measure = async (files, external) => {
  const bundle = await rolldown({
    input: files,
    external: [...PEERS, ...external],
    logLevel: "silent",
  });

  const getCode = async (minify) => {
    const { output } = await bundle.generate({ format: "esm", minify });

    return output
      .flatMap((chunk) => (chunk.type === "chunk" ? [chunk.code] : []))
      .join("\n");
  };

  const raw = await getCode(false);
  const minified = await getCode(true);

  await bundle.close();

  return {
    raw: Buffer.byteLength(raw),
    minified: Buffer.byteLength(minified),
    gzip: gzipSync(minified).byteLength,
  };
};

const rows = [];
const over = [];

for (const { name, files, budget, external = [] } of ENTRIES) {
  const size = await measure(files, external);

  rows.push({ entry: name, ...size, budget: budget ?? "none" });

  if (budget !== null && size.gzip > budget) {
    over.push(`${name} is ${size.gzip} B gzip, over its ${budget} B budget.`);
  }
}

console.table(rows);
console.log(
  "Rolldown bundle of the built entries, minified, peers external; gzip by node:zlib.",
);

assert.deepEqual(over, [], over.join("\n"));
