import { PdfViewer } from "./PdfViewer.client";
import type { FC } from "react";

export type PdfBodyComponent = FC<{ url: string }>;

export const pdfBodies: Record<string, PdfBodyComponent> = {
  // Now importing the 'Safe' dynamic version directly
  "default": PdfViewer,
};