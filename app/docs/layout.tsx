import { createMdxComponents } from "@/components/mdx";
import { PdfViewer } from "@/components/pdf-viewer";
import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import {
  DocsBody,
  DocsCategory,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import type { ReactNode } from "react";
import { baseOptions } from "@/app/layout.config";
import { source } from "@/lib/source";
import { Body } from "./layout.client";
import { BoxIcon, RocketIcon } from "lucide-react";
import type { DocContent } from "@/lib/compile-doc";

type PageNode = NonNullable<ReturnType<typeof source.getPage>>;

export function DocsContent({
  content,
  page,
  slug,
}: {
  content: DocContent;
  page: PageNode;
  slug?: string[];
}) {
  if (content.type === "pdf") {
    return (
      <DocsPage toc={content.toc} full={content.full}>
        <DocsTitle>{content.title}</DocsTitle>
        <DocsDescription>{content.description}</DocsDescription>
        <DocsBody>
          <PdfViewer src={content.url} title={content.title} />
        </DocsBody>
      </DocsPage>
    );
  }

  const MdxContent = content.body;

  return (
    <DocsPage toc={content.toc} full={content.full}>
      <DocsTitle>{content.title}</DocsTitle>
      <DocsDescription>{content.description}</DocsDescription>
      <DocsBody>
        <MdxContent components={createMdxComponents(slug?.[0] === "app")} />
        {page.file.name === "index" && <DocsCategory page={page} from={source} />}
      </DocsBody>
    </DocsPage>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Body>
      <DocsLayout
        tree={source.pageTree}
        {...baseOptions}
        sidebar={{
          prefetch: false,
          tabs: [
            {
              title: "我的退休金",
              description: "Features available in /app",
              icon: (
                <span className="border border-blue-600/50 bg-gradient-to-t from-blue-600/30 rounded-lg p-1 text-blue-600">
                  <BoxIcon />
                </span>
              ),
            },
            {
              title: "台灣路用",
              icon: (
                <span className="border border-fd-foreground/50 bg-gradient-to-t from-fd-foreground/30 rounded-lg p-1 text-fd-foreground">
                  <RocketIcon />
                </span>
              ),
              url: "/docs/TaiwanPersonalDocs",
            },
          ],
        }}
      >
        {children}
      </DocsLayout>
    </Body>
  );
}
