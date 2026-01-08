import type { VirtualFile } from "fumadocs-core/source";

export const meta: VirtualFile[] = [
  {
    type: "meta",
    data: {
      title: "App Router",
      root: true,
      pages: [
        "[Overview](/docs/app)",
        "---Architecture---",
        "...01-taiwan-personal-docs",
        "...02-house-utilities",
        "...03-house-patio",
        "...04-house-maint",
        "...05-health-and-dental",
        "...06-ssa-and-medicare",
        "...07-invest-and-ira",
        "...08-taiwan-house",
        "...09-tax-docs",
        "...10-banks-and-cards",
        "---Getting Started---",
        "...01-getting-started",
        "---Examples---",
        "[Overview](/docs/app/examples)",
        "...02-examples",
        "---Building Your Application---",
        "...03-building-your-application",
        "---API Reference---",
        "...04-api-reference",
      ],
    },
    path: "01-app/meta.json",
  },
  {
    type: "meta",
    data: {
      title: "Pages Router",
      root: true,
    },
    path: "02-pages/meta.json",
  },
];
