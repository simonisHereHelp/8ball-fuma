import type { FC } from "react";

export type PdfBodyComponent = FC<{ url: string }>;

/**
 * Add custom PDF renderers keyed by slug (e.g., "HealthAndDental/my-policy").
 * This allows you to use react-pdf or other libraries for specific files.
 */
export const pdfBodies: Record<string, PdfBodyComponent> = {
  // Example:
  // "docs/MySpecialPdf": (props) => <MyCustomViewer url={props.url} />,
  // "InvestAndIRA/Summary": (props) => <div className="p-4 border">Custom View: {props.url}</div>,
};