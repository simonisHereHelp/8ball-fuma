import type { FC } from "react";
import type { MDXComponents } from "mdx/types";
import type { CompiledPage } from "./compile-md";

export interface CompilePdfOptions {
  url: string;
  title?: string;
  description?: string;
  body?: FC<{ components?: MDXComponents }>;
  full?: boolean;
}

const cache = new Map<string, Promise<CompiledPage>>();

function createDefaultPdfBody(url: string): FC<{ components?: MDXComponents }> {
  const PdfBody: FC<{ components?: MDXComponents }> = () => (
    <div className="w-full h-[800px] rounded-xl overflow-hidden border border-fd-border bg-fd-card">
      <iframe
        src={url}
        className="w-full h-full"
        title="PDF Viewer"
        allow="autoplay"
      />
    </div>
  );

  PdfBody.displayName = "DocsPdfDefaultBody";
  return PdfBody;
}

export async function compilePdf(
  filePath: string,
  { url, title, description, body, full = true }: CompilePdfOptions,
): Promise<CompiledPage> {
  const bodyName = body?.displayName ?? body?.name ?? "default";
  const key = [filePath, url, title ?? "", description ?? "", bodyName, full].join("|");
  
  const cached = cache.get(key);
  if (cached) return cached;

  const compiling = Promise.resolve<CompiledPage>({
    body: body ?? createDefaultPdfBody(url),
    description,
    full,
    pdfUrl: url,
    title,
    toc: [],
  });

  cache.set(key, compiling);
  return compiling;
}