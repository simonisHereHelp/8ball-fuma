import { createMdxComponents } from "./mdx";
import { PdfViewer } from "./pdf-viewer";
import {
  DocsBody,
  DocsCategory,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import { source } from "@/lib/source";
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
