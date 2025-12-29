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
import { pdfBodies } from "../pdf-bodies";

export const revalidate = 30;

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  let content = await page.data.load();

  if (content.source) {
    const sourcePage = source.getPage(content.source.split("/"));
    if (!sourcePage) throw new Error(`unresolved source: ${content.source}`);
    content = await sourcePage.data.load();
  }

  const slugKey = params.slug?.join("/") ?? "index";
  const mdxComponents = createMdxComponents(params.slug?.[0] === "app");

  // Functional wrapper to branch between MDX and PDF rendering
  const BodyContent = () => {
    // 1. If it's a PDF, check for custom renderer first, then fallback to default
    if (content.pdfUrl) {
      const CustomPdf = pdfBodies[slugKey];
      if (CustomPdf) {
        return <CustomPdf url={content.pdfUrl} />;
      }
      // Fallback to the default iframe viewer compiled in content.body
      const DefaultViewer = content.body;
      return <DefaultViewer />;
    }

    // 2. Standard MDX/MD/TXT content using provided components
    const MdxBody = content.body;
    return <MdxBody components={mdxComponents} />;
  };

  return (
    <DocsPage toc={content.toc} full={content.full}>
      <DocsTitle>{content.title}</DocsTitle>
      <DocsDescription>{content.description}</DocsDescription>
      <DocsBody>
        <BodyContent />
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

  return { title: page.data.title };
}