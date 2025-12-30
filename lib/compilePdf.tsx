import type { FC } from "react";
import type { MDXComponents } from "mdx/types";
import type { CompiledPage } from "./compile-md";

export interface CompilePdfOptions {
  url: string;
  title?: string;
  description?: string;
  downloadUrl?: string; // Add this for the API link
}

const cache = new Map<string, Promise<CompiledPage>>();

export async function compilePdf(
  filePath: string,
  { url, title, description, downloadUrl }: CompilePdfOptions,
): Promise<CompiledPage> {
  const key = `pdf|${filePath}|${url}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const compiling = Promise.resolve<CompiledPage>({
    // We return an empty component because page.tsx will 
    // prioritize the pdfBodies[slugKey] switchboard.
    body: (() => null) as unknown as FC<{ components?: MDXComponents }>,
    description,
    full: true,
    pdfUrl: url,
    downloadUrl: downloadUrl, // Store this in the page data
    title,
    toc: [],
  });

  cache.set(key, compiling);
  return compiling;
}