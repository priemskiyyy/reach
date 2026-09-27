import type { Section } from "src/types/Section";
import type { SectionId } from "src/types/SectionId";

export const SECTIONS: Record<SectionId, Section> = {
  app: { number: 1, title: "Back up what the network allows", label: "App" },
  evidence: {
    number: 2,
    title: "Every fact names its evidence",
    label: "Evidence",
  },
  conditions: {
    number: 3,
    title: "Met, unmet or unknown",
    label: "Conditions",
  },
  endpoint: {
    number: 4,
    title: "One check, however many ask",
    label: "Endpoint",
  },
  lab: { number: 5, title: "Break the network", label: "Lab" },
  timeline: { number: 6, title: "Watch it happen", label: "Timeline" },
};

export const SECTION_IDS: SectionId[] = [
  "app",
  "evidence",
  "conditions",
  "endpoint",
  "lab",
  "timeline",
];
