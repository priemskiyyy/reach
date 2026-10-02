/**
 * Classes the fuzz finds and Reach documents, so they are skipped by name
 * rather than fixed. A new class that is not listed fails the run.
 */
export const DOCUMENTED_LIMITS: Array<{ kind: string; citation: string }> = [
  {
    kind: "state.error-without-world-error",
    citation:
      "docs/lifecycle.md: a failed or timed-out refresh marks every fact error, and a late answer is dropped.",
  },
  {
    kind: "condition.online",
    citation:
      "docs/lifecycle.md: the facts a timed-out refresh marked error read unknown, so a condition over them is unknown.",
  },
  {
    kind: "condition.offline",
    citation:
      "docs/lifecycle.md: the facts a timed-out refresh marked error read unknown, so a condition over them is unknown.",
  },
];
