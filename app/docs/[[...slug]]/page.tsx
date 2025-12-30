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

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  
  if (!page) notFound();

  // Load content (This includes either the MDX body or the pdfUrl metadata)
  const content = await page.data.load();
  const slugKey = params.slug?.join("/") ?? "index";
  const mdxComponents = createMdxComponents(params.slug?.[0] === "app");

  // Determine which viewer to use from the registry
  // We resolve the component choice here, but render it below
  const PdfViewerComponent = content.pdfUrl 
    ? (pdfBodies[slugKey] || pdfBodies["default"]) 
    : null;

  return (
    <DocsPage toc={content.toc} full={content.full}>
      <DocsTitle>{content.title}</DocsTitle>
      <DocsDescription>{content.description}</DocsDescription>
      <DocsBody>
        {/* Logic: 
            If it's a PDF, render the Registry component.
            Otherwise, render the standard MDX Body.
        */}
        {PdfViewerComponent && content.pdfUrl ? (
          <PdfViewerComponent url={content.pdfUrl} />
        ) : (
          <content.body components={mdxComponents} />
        )}

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
    description: page.data.description 
  };
}