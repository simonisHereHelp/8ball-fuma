import { DocsContent } from "@/components/docs-context";
import { toMdxContent, type DocContent } from "@/lib/compile-doc";
import { isLocal, source } from "@/lib/source";
import { notFound } from "next/navigation";

export const revalidate = 30; // reval every page in eg. 7200 (every 2 hours) pr = 0

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  let content = (await page.data.load()) as DocContent;

  if (content.type === "mdx" && content.source) {
    const sourcePage = source.getPage(content.source.split("/"));

    if (!sourcePage)
      throw new Error(
        `unresolved source in frontmatter of ${page.file.path}: ${content.source}`,
      );
    content = toMdxContent(await sourcePage.data.load());
  }

  return (
    <DocsContent content={content} page={page} slug={params.slug} />
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
