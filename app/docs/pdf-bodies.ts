import type { FC } from "react";

export type PdfBodyComponent = FC<{ url: string }>;

// Add custom PDF renderers keyed by slug (e.g., "folder/file").
export const pdfBodies: Record<string, PdfBodyComponent> = {};