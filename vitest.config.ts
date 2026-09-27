import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import type { TestProjectConfiguration } from "vitest/config";

type ProjectOptions = {
  environment: "node" | "jsdom";
  dedupe: string[];
};

const PROJECT_OPTIONS: Record<string, Partial<ProjectOptions>> = {
  // A binding must render against the same React instance as the renderer under test.
  react: { environment: "jsdom", dedupe: ["react", "react-dom"] },
};

const project = (directory: string, name: string) => {
  const options = PROJECT_OPTIONS[name] ?? {};

  return {
    extends: true,
    resolve: {
      alias: {
        src: fileURLToPath(
          new URL(`./${directory}/${name}/src`, import.meta.url),
        ),
      },
      dedupe: options.dedupe ?? [],
    },
    test: {
      name,
      include: [`${directory}/${name}/src/**/*.test.{ts,tsx}`],
      environment: options.environment ?? "node",
    },
  } satisfies TestProjectConfiguration;
};

// Every package is a project named after its folder, so a new one is tested
// without being listed here.
const discover = (directory: string) => {
  const root = new URL(`./${directory}`, import.meta.url);

  if (!existsSync(root)) {
    return [];
  }

  return readdirSync(root).flatMap((name) => {
    const manifest = new URL(
      `./${directory}/${name}/package.json`,
      import.meta.url,
    );

    if (!existsSync(manifest)) {
      return [];
    }

    return [project(directory, name)];
  });
};

// Every example gets its project here, added only once its directory exists.
const examples: Record<string, TestProjectConfiguration[]> = {
  shared: [
    {
      extends: true,
      test: {
        name: "example-shared",
        include: ["examples/shared/**/*.test.ts"],
      },
    },
  ],
  react: [
    {
      extends: true,
      resolve: {
        alias: {
          src: fileURLToPath(new URL("./examples/react/src", import.meta.url)),
        },
        dedupe: ["react", "react-dom"],
      },
      test: {
        name: "example-react",
        include: ["examples/react/src/**/*.test.{ts,tsx}"],
        environment: "jsdom",
        // Node would load the icons with their own React; through Vite they share
        // the deduplicated one, as CI's React version swap needs.
        server: { deps: { inline: ["@phosphor-icons/react"] } },
      },
    },
  ],
  server: [
    {
      extends: true,
      resolve: {
        alias: {
          src: fileURLToPath(new URL("./examples/server/src", import.meta.url)),
        },
      },
      test: {
        name: "example-server",
        include: ["examples/server/src/**/*.test.ts"],
      },
    },
  ],
};

const exampleProjects = Object.entries(examples).flatMap(([name, projects]) => {
  if (
    !existsSync(new URL(`./examples/${name}/package.json`, import.meta.url))
  ) {
    return [];
  }

  return projects;
});

export default defineConfig({
  test: {
    globals: false,
    restoreMocks: true,
    projects: [
      ...discover("packages"),
      ...discover("packages/adapters"),
      ...exampleProjects,
    ],
  },
});
