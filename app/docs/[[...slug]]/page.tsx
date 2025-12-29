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

  let content = await page.data.load();
  const slugKey = params.slug?.join("/") ?? "index";
  const mdxComponents = createMdxComponents(params.slug?.[0] === "app");

  // Logic: Routing between MDX and Featured PDF Viewer
    // Updated Logic: Use the switchboard for ALL PDFs
    const BodyRenderer = () => {
      if (content.pdfUrl) {
        // Check for a specific slug override, otherwise use the "default" featured viewer
        const Viewer = pdfBodies[slugKey] || pdfBodies["default"];
        return <Viewer url={content.pdfUrl} />;
      }

      const MdxContent = content.body;
      return <MdxContent components={mdxComponents} />;
    };

    return (
      <DocsPage toc={content.toc} full={content.full}>
        <DocsTitle>{content.title}</DocsTitle>
        <DocsDescription>{content.description}</DocsDescription>
        <DocsBody>
          <BodyRenderer /> 
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