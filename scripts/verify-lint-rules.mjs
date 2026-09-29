import assert from "node:assert/strict";
import { ESLint } from "eslint";

const eslint = new ESLint();

const CORE = "packages/core/src/utils/lint-probe.ts";
const CLOCK = "packages/core/src/utils/internal/clock/createSystemClock.ts";
const MOCK = "packages/core/src/mock/lint-probe.ts";
const ADAPTER = "packages/adapters/browser/src/lint-probe.ts";
const NATIVE_ADAPTER = "packages/adapters/netinfo/src/lint-probe.ts";
const REACT = "packages/react/src/lint-probe.ts";
const SOLID = "packages/solid/src/lint-probe.ts";
const VUE = "packages/vue/src/lint-probe.ts";
const QUERY = "packages/tanstack-query/src/lint-probe.ts";
const TEST = "packages/core/src/utils/lint-probe.test.ts";

const syntax = [
  ['import { value } from "./value";', "no-restricted-syntax"],
  ['import type { Value } from "../types";', "no-restricted-syntax"],
  ['const value = import("./value");', "no-restricted-syntax"],
  ['type Value = import("../value").Value;', "no-restricted-syntax"],
  [
    "const value = 1 as number;",
    "@typescript-eslint/consistent-type-assertions",
  ],
  ["const value = [1] as const;", "no-restricted-syntax"],
  [
    "// eslint-disable-next-line no-restricted-syntax\nconst value = [1] as const;",
    "no-restricted-syntax",
  ],
  ["/* eslint-disable */\nconst value = [1] as const;", "no-restricted-syntax"],
  ["const value = <number>1;", "no-restricted-syntax"],
  ["const value: string | null = null; value!;", "no-restricted-syntax"],
  ["enum State { Ready }", "no-restricted-syntax"],
  ["switch (1) { default: break; }", "no-restricted-syntax"],
  ["void Promise.resolve();", "no-restricted-syntax"],
  ["let value; value ??= 1;", "no-restricted-syntax"],
  ["let value = 0; value ||= 1;", "no-restricted-syntax"],
  ["let value = 0; value &&= 1;", "no-restricted-syntax"],
  ["type Value = { readonly key: string };", "no-restricted-syntax"],
  ["type Value = { readonly [key: string]: string };", "no-restricted-syntax"],
  ["class Value { readonly key = 1; }", "no-restricted-syntax"],
  [
    "class Value { constructor(readonly key: string) {} }",
    "no-restricted-syntax",
  ],
  [
    "type Value<T> = { readonly [K in keyof T]: T[K] };",
    "no-restricted-syntax",
  ],
  ["type Value = readonly string[];", "no-restricted-syntax"],
  ["type Value = Readonly<{ key: string }>;", "no-restricted-syntax"],
  ["type Value = ReadonlyArray<string>;", "no-restricted-syntax"],
  ['export * from "src/value";', "no-restricted-syntax"],
  [
    "declare const source: { removeAllListeners: () => void }; source.removeAllListeners();",
    "no-restricted-syntax",
  ],
  [
    "declare const sdk: { configure: (options: object) => void }; sdk.configure({});",
    "no-restricted-syntax",
  ],
  [
    "interface Value { key: string }",
    "@typescript-eslint/consistent-type-definitions",
  ],
  ["const value: any = 1;", "@typescript-eslint/no-explicit-any"],
  [
    'import { Value } from "src/value";\n\ntype Copy = Value;',
    "@typescript-eslint/consistent-type-imports",
  ],
  ["if (true) console.log(1);", "curly"],
  [
    "function value(flag) { if (flag) { return 1; } else { return 2; } }",
    "no-else-return",
  ],
  [
    "const first = 1;\nif (first) {\n  first;\n}",
    "padding-line-between-statements",
  ],
  [
    "function value() {\n  const first = 1;\n  return first;\n}",
    "padding-line-between-statements",
  ],
];

// The core is platform neutral and keeps time only through its clock; an
// adapter never imports its provider SDK at runtime.
const boundaries = [
  ['import { useState } from "react";', "no-restricted-imports", CORE],
  ['import { AppState } from "react-native";', "no-restricted-imports", CORE],
  ['import { expect } from "vitest";', "no-restricted-imports", MOCK],
  [
    'import { render } from "@testing-library/react";',
    "no-restricted-imports",
    CORE,
  ],
  [
    'import NetInfo from "@react-native-community/netinfo";',
    "no-restricted-imports",
    NATIVE_ADAPTER,
  ],
  [
    'import * as Network from "expo-network";',
    "no-restricted-imports",
    NATIVE_ADAPTER,
  ],
  [
    'import { onlineManager } from "@tanstack/query-core";',
    "no-restricted-imports",
    CORE,
  ],
  ['import { useState } from "react";', "no-restricted-imports", ADAPTER],
  ['import { createSignal } from "solid-js";', "no-restricted-imports", CORE],
  ['import { createSignal } from "solid-js";', "no-restricted-imports", REACT],
  ['import { createSignal } from "solid-js";', "no-restricted-imports", QUERY],
  ['import { useState } from "react";', "no-restricted-imports", SOLID],
  ["setTimeout(() => {}, 0);", "no-restricted-globals", SOLID],
  ['import { ref } from "vue";', "no-restricted-imports", CORE],
  ['import { ref } from "vue";', "no-restricted-imports", REACT],
  ['import { ref } from "@vue/reactivity";', "no-restricted-imports", SOLID],
  ['import { useState } from "react";', "no-restricted-imports", VUE],
  ['import { createSignal } from "solid-js";', "no-restricted-imports", VUE],
  ["setTimeout(() => {}, 0);", "no-restricted-globals", VUE],
  ['import { useState } from "react";', "no-restricted-imports", QUERY],
  [
    'import { onlineManager } from "@tanstack/query-core";',
    "no-restricted-imports",
    QUERY,
  ],
  [
    'import NetInfo from "@react-native-community/netinfo";',
    "no-restricted-imports",
    REACT,
  ],
  ["setTimeout(() => {}, 0);", "no-restricted-globals", REACT],
  [
    'import { useState } from "react";\n\nexport const useValue = (flag: boolean) => {\n  if (flag) {\n    useState(0);\n  }\n};',
    "react-hooks/rules-of-hooks",
    REACT,
  ],
  ["setTimeout(() => {}, 0);", "no-restricted-globals", CORE],
  ["setInterval(() => {}, 1_000);", "no-restricted-globals", MOCK],
  ["setTimeout(() => {}, 0);", "no-restricted-globals", ADAPTER],
  ["const view = window;", "no-restricted-globals", CORE],
  ["const page = document;", "no-restricted-globals", CLOCK],
  ["const agent = navigator;", "no-restricted-globals", MOCK],
  ["const time = Date.now();", "no-restricted-properties", CORE],
  ["const time = performance.now();", "no-restricted-properties", CORE],
  ["const time = Date.now();", "no-restricted-properties", ADAPTER],
  [
    'export { value } from "src/value";',
    "no-restricted-syntax",
    "packages/core/src/utils/index.ts",
  ],
  [
    "function value() {\n  console.log(1);\n  return 1;\n}",
    "padding-line-between-statements",
    "scripts/lint-probe.mjs",
  ],
];

const entryPoints = [
  "packages/core/src/index.ts",
  "packages/core/src/mock.ts",
  "packages/core/src/testing.ts",
  "packages/adapters/browser/src/index.ts",
  "packages/adapters/netinfo/src/index.ts",
  "packages/adapters/expo-network/src/index.ts",
  "packages/adapters/http/src/index.ts",
  "packages/react/src/index.ts",
  "packages/solid/src/index.ts",
  "packages/vue/src/index.ts",
  "packages/tanstack-query/src/index.ts",
];

const allowed = [
  ['import { value } from "src/value";\n\nexport const copy = value;', CORE],
  ...entryPoints.map((file) => ['export { value } from "src/value";', file]),
  ["export const value = { key: 1 } satisfies Record<string, number>;", CORE],
  ['import { expect } from "vitest";\n\nexpect(1).toBe(1);', TEST],
  [
    'import NetInfo from "@react-native-community/netinfo";\n\nexport const sdk = NetInfo;',
    "packages/adapters/netinfo/src/netInfo.contracts.ts",
  ],
  [
    'import * as Network from "expo-network";\n\nexport const sdk = Network;',
    "packages/adapters/expo-network/src/expoNetwork.contracts.ts",
  ],
  [
    'import { onlineManager } from "@tanstack/query-core";\n\nexport const manager = onlineManager;',
    "packages/tanstack-query/src/toOnlineEventListener.contracts.ts",
  ],
  [
    'import { useState } from "react";\n\nexport const useValue = () => useState(0);',
    REACT,
  ],
  [
    'import { createSignal } from "solid-js";\n\nexport const signal = createSignal;',
    SOLID,
  ],
  ['import { ref } from "vue";\n\nexport const value = ref;', VUE],
  [
    'import { vi } from "vitest";\n\nexport const spy = vi.fn();',
    "packages/adapters/browser/src/fakeWindow.fixture.ts",
  ],
  ["export const view = globalThis.window;", ADAPTER],
  ["export const online = navigator.onLine;", ADAPTER],
  [
    "export const cancel = setTimeout(() => {}, 0);\n\nclearTimeout(cancel);",
    CLOCK,
  ],
  ["export const time = Date.now() + performance.now();", CLOCK],
  ["export const time = Date.now();", TEST],
];

const getRuleIds = async (code, filePath) => {
  const [result] = await eslint.lintText(code, { filePath });

  return result.messages.map(
    (message) => message.ruleId ?? `parse error: ${message.message}`,
  );
};

const probes = [...syntax, ...boundaries];

for (const [code, rule, filePath = CORE] of probes) {
  const ruleIds = await getRuleIds(code, filePath);

  assert(
    ruleIds.includes(rule),
    `Missing lint rejection: ${rule} in ${filePath}: ${code}`,
  );
}

for (const [code, filePath] of allowed) {
  const ruleIds = await getRuleIds(code, filePath);

  assert.deepEqual(
    ruleIds,
    [],
    `Unexpected lint report ${ruleIds.join(", ")} in ${filePath}: ${code}`,
  );
}

console.log(
  `Verified ${syntax.length} syntax restrictions, ${boundaries.length} boundary rules and ${allowed.length} allowed forms.`,
);
