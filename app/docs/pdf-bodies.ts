import dynamic from "next/dynamic";
import type { FC } from "react";

export type PdfBodyComponent = FC<{ url: string }>;

// We use dynamic loading here so the PDF client code isn't 
// bundled into the main MDX documentation pages.
const DefaultFeaturedViewer = dynamic(() => import("./PdfViewer.client"), {
  ssr: false,
  loading: () => <div className="h-[800px] animate-pulse bg-fd-muted rounded-xl" />
});

export const pdfBodies: Record<string, PdfBodyComponent> = {
  // Use 'default' as a catch-all or map specific slugs
  "default": DefaultFeaturedViewer,
};