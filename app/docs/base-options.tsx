import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export const baseOptions: BaseLayoutProps = {
  links: [
    {
      text: "Drive Docs",
      url: "/docs/pages",
      active: "nested-url",
    },
    {
      text: "Prep RAG",
      url: "/docs/prep-rag",
    },
  ],
};
