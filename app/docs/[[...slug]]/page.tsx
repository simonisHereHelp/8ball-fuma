import { createMdxComponents } from "@/components/mdx";
import { isLocal, source } from "@/lib/source";
import {
  DocsPage,
  DocsBody,
  DocsDescription,
  DocsTitle,
  DocsCategory,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import type { FC } from "react";
import type { MDXComponents } from "mdx/types";
import { pdfBodies } from "../pdf-bodies";

export const revalidate = 30; // reval every page in eg. 7200 (every 2 hours) pr = 0

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  let content = await page.data.load();

  if (content.source) {
    const sourcePage = source.getPage(content.source.split("/"));

    if (!sourcePage)
      throw new Error(
        `unresolved source in frontmatter of ${page.file.path}: ${content.source}`,
      );
    content = await sourcePage.data.load();
  }

    const slugKey = params.slug?.join("/") ?? "index";
    const MdxContent = content.body;
    const mdxComponents = createMdxComponents(params.slug?.[0] === "app");
    const BodyRenderer: FC<{ components?: MDXComponents }> =
      content.pdfUrl && pdfBodies[slugKey]
        ? () => {
            const PdfBody = pdfBodies[slugKey]!;
            return <PdfBody url={content.pdfUrl!} />;
          }
        : MdxContent;

  return (
    <DocsPage toc={content.toc} full={content.full}>
      <DocsTitle>{content.title}</DocsTitle>
      <DocsDescription>{content.description}</DocsDescription>
      <DocsBody>
      <BodyRenderer components={mdxComponents} />
        {page.file.name === "index" && (
          <DocsCategory page={page} from={source} />
        )}
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams(): { slug?: string[] }[] {
  if (isLocal) return source.generateParams();
  return [];
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
  };
}
