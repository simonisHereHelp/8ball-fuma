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
    <div className="flex flex-col gap-4">
      <object
        data={url}
        type="application/pdf"
        className="w-full min-h-[70vh] rounded-xl border border-fd-border"
      >
        <p className="text-sm text-muted-foreground">
          Your browser does not support embedded PDFs. {""}
          <a className="text-fd-primary underline" href={url} target="_blank" rel="noreferrer">
            Open the document in a new tab
          </a>
          .
        </p>
      </object>
      <a
        className="text-sm text-fd-primary underline"
        href={url}
        target="_blank"
        rel="noreferrer"
      >
        Download PDF
      </a>
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
  const key = [filePath, url, title ?? "", description ?? "", bodyName, full ? "full" : "compact"].join(
    "|",
  );
  const cached = cache.get(key);

  if (cached) return cached;

  console.time(`compile pdf: ${filePath}`);
  const compiling = Promise.resolve<CompiledPage>({
    body: body ?? createDefaultPdfBody(url),
    description,
    full,
    pdfUrl: url,
    title,
    toc: [],
  }).finally(() => {
    console.timeEnd(`compile pdf: ${filePath}`);
  });

  cache.set(key, compiling);

  return compiling;
}