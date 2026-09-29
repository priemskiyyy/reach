import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const OUTPUT = ".artifacts/snippets";
const FENCE = /(<!-- snippet: fragment -->\n)?```(ts|tsx)\n([\s\S]*?)```/g;

// Each published entry resolves to its built declarations, as a consumer's would.
const ENTRIES = {
  "@priemskiyyy/reach": "packages/core/dist/index.d.ts",
  "@priemskiyyy/reach/mock": "packages/core/dist/mock.d.ts",
  "@priemskiyyy/reach/testing": "packages/core/dist/testing.d.ts",
  "@priemskiyyy/reach-browser": "packages/adapters/browser/dist/index.d.ts",
  "@priemskiyyy/reach-netinfo": "packages/adapters/netinfo/dist/index.d.ts",
  "@priemskiyyy/reach-expo-network":
    "packages/adapters/expo-network/dist/index.d.ts",
  "@priemskiyyy/reach-http": "packages/adapters/http/dist/index.d.ts",
  "@priemskiyyy/reach-react": "packages/react/dist/index.d.ts",
  "@priemskiyyy/reach-solid": "packages/solid/dist/index.d.ts",
  "@priemskiyyy/reach-vue": "packages/vue/dist/index.d.ts",
  "@priemskiyyy/reach-tanstack-query":
    "packages/tanstack-query/dist/index.d.ts",
};

const listMarkdown = (directory) =>
  existsSync(directory)
    ? readdirSync(directory)
        .filter((name) => name.endsWith(".md"))
        .map((name) => join(directory, name))
    : [];

const listReadmes = (directory) =>
  readdirSync(directory)
    .map((name) => join(directory, name, "README.md"))
    .filter((file) => existsSync(file));

const files = [
  "README.md",
  ...listMarkdown("docs"),
  ...listReadmes("packages"),
  ...listReadmes("packages/adapters"),
].filter((file) => existsSync(file));

for (const file of Object.values(ENTRIES)) {
  if (!existsSync(file)) {
    throw new Error(`${file} is missing. Run pnpm build first.`);
  }
}

rmSync(OUTPUT, { recursive: true, force: true });
mkdirSync(OUTPUT, { recursive: true });

const sources = new Map();

for (const file of files) {
  const markdown = readFileSync(file, "utf8");

  for (const match of markdown.matchAll(FENCE)) {
    const [, fragment, extension, code] = match;
    const line = markdown.slice(0, match.index).split("\n").length;
    const name = `${file.replaceAll(/[^a-z0-9]+/gi, "-")}-${line}.${extension}`;

    // A fragment, such as bare JSX, is checked as an expression.
    const body = fragment
      ? `export const fragment = (\n${code}\n);\n`
      : `${code}\nexport {};\n`;

    writeFileSync(join(OUTPUT, name), body);
    sources.set(name, `${file}:${line}`);
  }
}

const paths = Object.fromEntries(
  Object.entries(ENTRIES).map(([name, file]) => [name, [`../../${file}`]]),
);

writeFileSync(
  join(OUTPUT, "tsconfig.json"),
  JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        module: "ESNext",
        moduleResolution: "Bundler",
        jsx: "react-jsx",
        strict: true,
        exactOptionalPropertyTypes: true,
        noUncheckedIndexedAccess: true,
        skipLibCheck: true,
        noEmit: true,
        types: ["node"],
        typeRoots: ["../../node_modules/@types"],
        paths,
      },
      include: [
        "*.ts",
        "*.tsx",
        "../../scripts/snippets.ambient.d.ts",
        "../../scripts/snippets.modules.d.ts",
      ],
    },
    null,
    2,
  ),
);

try {
  execFileSync("tsc", ["-p", join(OUTPUT, "tsconfig.json")], {
    encoding: "utf8",
    stdio: "pipe",
  });
} catch (error) {
  const output = `${error.stdout ?? ""}${error.stderr ?? ""}`;

  // Name each failing snippet by the Markdown file and line it came from.
  const located = output.replaceAll(
    /[^\s(]*?([A-Za-z0-9-]+\.tsx?)\((\d+),(\d+)\)/g,
    (whole, name, line, column) =>
      sources.has(name)
        ? `${sources.get(name)} (snippet line ${line}, column ${column})`
        : whole,
  );

  console.error(located);
  process.exit(1);
}

console.log(`Typechecked ${sources.size} snippets from ${files.length} files.`);
