import type { FC } from "react";
import type { MDXComponents } from "mdx/types";
import type { CompiledPage } from "./compile-md";

export interface CompilePdfOptions {
  url: string;
  title?: string;
  description?: string;
}

const cache = new Map<string, Promise<CompiledPage>>();

/**
 * compilePdf.tsx
 * Handles metadata extraction for the page tree and SEO.
 * The actual rendering is offloaded to PdfViewer.client via the pdfUrl.
 */
export async function compilePdf(
  filePath: string,
  { url, title, description }: CompilePdfOptions,
): Promise<CompiledPage> {
  const key = `pdf|${filePath}|${url}`;
  
  // 1. Check Cache to prevent redundant processing during build/revalidate
  const cached = cache.get(key);
  if (cached) return cached;

  const compiling = Promise.resolve<CompiledPage>({
    // We return a null component; page.tsx uses this to trigger the PdfViewer switch
    body: (() => null) as unknown as FC<{ components?: MDXComponents }>,
    description: description ?? "", 
    full: true,
    pdfUrl: url, // The "Master" URL passed to PdfViewer.client
    title: title ?? "Untitled Document", // Fallback for sidebar rendering
    toc: [],
  });

  // 2. Store in cache
  cache.set(key, compiling);
  
  return compiling;
}