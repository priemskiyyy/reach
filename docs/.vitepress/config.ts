import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitepress";

const siteUrl = process.env.DOCS_SITE_URL;

const repositoryUrl =
  process.env.DOCS_REPOSITORY_URL ?? "https://github.com/priemskiyyy/reach";

const base =
  process.env.DOCS_BASE_PATH ?? (siteUrl ? new URL(siteUrl).pathname : "/");

const description =
  "Reactive network state and conditions for TypeScript, with explicit uncertainty, scoped endpoint checks and deterministic ownership, on the web and in React Native.";

// llms.txt lists every guide with its description; llms-full.txt inlines them.
const writeLlmsText = async (srcDir: string, outDir: string) => {
  const origin = siteUrl ? siteUrl.replace(/\/$/, "") : base.replace(/\/$/, "");

  const files = (await readdir(srcDir, { recursive: true }))
    .filter((file) => file.endsWith(".md"))
    .filter((file) => !file.startsWith(".vitepress"))
    .filter((file) => file !== "README.md" && file !== "index.md")
    .sort();

  const pages = await Promise.all(
    files.map(async (file) => {
      const source = await readFile(join(srcDir, file), "utf8");
      const title = source.match(/^# (.+)$/m)?.[1] ?? file;
      const summary = source.match(/^description: "(.+)"$/m)?.[1] ?? "";
      const url = `${origin}/${file.replace(/\.md$/, "")}`;

      return { title, summary, url, source };
    }),
  );

  const index = [
    "# Reach",
    "",
    `> ${description}`,
    "",
    "## Docs",
    "",
    ...pages.map(
      ({ title, summary, url }) => `- [${title}](${url}): ${summary}`,
    ),
    "",
  ].join("\n");

  const full = pages
    .map(({ url, source }) => `<!-- ${url} -->\n${source.trim()}`)
    .join("\n\n---\n\n");

  await writeFile(join(outDir, "llms.txt"), index);
  await writeFile(join(outDir, "llms-full.txt"), `${full}\n`);
};

export default defineConfig({
  base,
  lang: "en-US",
  title: "Reach",
  description,
  head: [
    [
      "link",
      { rel: "icon", type: "image/svg+xml", href: `${base}favicon.svg` },
    ],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: "Reach" }],
    ["meta", { name: "twitter:card", content: "summary" }],
    ["meta", { name: "theme-color", content: "#0369a1" }],
  ],
  ...(siteUrl ? { sitemap: { hostname: siteUrl } } : {}),
  vite: {
    resolve: {
      alias: { src: fileURLToPath(new URL(".", import.meta.url)) },
    },
  },
  buildEnd: async ({ outDir, srcDir }) => {
    const sitemap = siteUrl
      ? `Sitemap: ${new URL("sitemap.xml", `${siteUrl.replace(/\/$/, "")}/`).href}\n`
      : "";

    await writeFile(
      join(outDir, "robots.txt"),
      `User-agent: *\nAllow: /\n${sitemap}`,
    );
    await writeLlmsText(srcDir, outDir);
  },
  transformHead: ({ pageData }) => {
    const title =
      pageData.title === "Reach" ? "Reach" : `${pageData.title} | Reach`;

    const head: [string, Record<string, string>][] = [
      ["meta", { property: "og:title", content: title }],
      [
        "meta",
        {
          property: "og:description",
          content: pageData.description || description,
        },
      ],
      ["meta", { name: "twitter:title", content: title }],
      [
        "meta",
        {
          name: "twitter:description",
          content: pageData.description || description,
        },
      ],
    ];

    // Without a site URL the build omits canonical URLs rather than assume a host.
    if (!siteUrl) {
      return head;
    }

    const pagePath = pageData.relativePath
      .replace(/(^|\/)index\.md$/, "$1")
      .replace(/\.md$/, "");

    const url = new URL(pagePath, `${siteUrl.replace(/\/$/, "")}/`).href;

    head.push(
      ["link", { rel: "canonical", href: url }],
      ["meta", { property: "og:url", content: url }],
    );

    return head;
  },
  srcExclude: ["README.md"],
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    socialLinks: repositoryUrl ? [{ icon: "github", link: repositoryUrl }] : [],
    ...(repositoryUrl
      ? {
          editLink: { pattern: `${repositoryUrl}/edit/main/docs/:path` },
        }
      : {}),
    nav: [
      { text: "Guide", link: "/getting-started" },
      { text: "Adapters", link: "/adapters" },
      {
        text: "Frameworks",
        items: [
          { text: "React", link: "/react" },
          { text: "Solid", link: "/solid" },
          { text: "Vue", link: "/vue" },
          { text: "Svelte", link: "/svelte" },
          { text: "React Native and Expo", link: "/react-native" },
          { text: "TanStack Query", link: "/tanstack-query" },
        ],
      },
      { text: "Example", link: "/examples" },
      {
        text: "Reference",
        items: [
          { text: "Writing an adapter", link: "/writing-an-adapter" },
          { text: "Verification matrix", link: "/verification" },
          { text: "Runtime architecture", link: "/internals/architecture" },
          { text: "Decisions", link: "/decisions" },
        ],
      },
    ],
    sidebar: [
      {
        text: "Start here",
        items: [
          { text: "What Reach is", link: "/" },
          { text: "Getting started", link: "/getting-started" },
          { text: "Installation", link: "/installation" },
          { text: "Evidence, not a Boolean", link: "/mental-model" },
          { text: "Example application", link: "/examples" },
        ],
      },
      {
        text: "The network",
        items: [
          { text: "Choose an adapter", link: "/adapters" },
          { text: "Conditions", link: "/conditions" },
          { text: "Deciding on unknown", link: "/unknown" },
          { text: "Native access", link: "/native-access" },
        ],
      },
      {
        text: "Endpoints",
        items: [
          { text: "Endpoints and freshness", link: "/endpoints" },
          { text: "Monitoring", link: "/monitoring" },
          { text: "HTTP endpoints", link: "/http" },
        ],
      },
      {
        text: "Runtime",
        items: [
          { text: "Lifecycle", link: "/lifecycle" },
          { text: "Server rendering", link: "/server-rendering" },
        ],
      },
      {
        text: "Frameworks",
        items: [
          { text: "React", link: "/react" },
          { text: "Solid", link: "/solid" },
          { text: "Vue", link: "/vue" },
          { text: "Svelte", link: "/svelte" },
          { text: "React Native and Expo", link: "/react-native" },
          { text: "TanStack Query", link: "/tanstack-query" },
          { text: "Sibling libraries", link: "/integrations" },
        ],
      },
      {
        text: "Inspect and test",
        items: [
          { text: "Diagnostics", link: "/diagnostics" },
          { text: "Application testing", link: "/testing" },
          { text: "Verification matrix", link: "/verification" },
          { text: "Troubleshooting", link: "/troubleshooting" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "Writing an adapter", link: "/writing-an-adapter" },
          { text: "Runtime architecture", link: "/internals/architecture" },
          { text: "Decisions", link: "/decisions" },
        ],
      },
    ],
    search: { provider: "local" },
    outline: { level: [2, 3] },
    footer: { message: "Released under the MIT License." },
  },
});
