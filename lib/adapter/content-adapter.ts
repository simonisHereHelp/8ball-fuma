import type { MDXComponents } from "mdx/types";
import type { FC } from "react";
import type { TableOfContents } from "fumadocs-core/server";

export type ContentKind =
  | "mdx"
  | "pdf"
  | "text"
  | "image"
  | "json"
  | "audio"
  | "video"
  | "smartBundle"
  | "fallback";

export interface DriveLocator {
  id: string;
  name: string;
  path: string[];
  mimeType?: string;
  modifiedTime?: string;
  size?: number;
  webViewLink?: string;
}

export interface BundleAsset {
  locator: DriveLocator;
  role: "primary" | "attachment" | "media" | "image" | "other";
}

export interface BundleDescriptor {
  key: string;
  label: string;
  primaryData?: DriveLocator;
  assets: BundleAsset[];
  attachments?: DriveLocator[];
}

export interface ContentMeta {
  title?: string;
  description?: string;
  breadcrumbs?: string[];
  tags?: string[];
  size?: number;
  modifiedTime?: string;
}

export interface CachePolicy {
  revalidate?: number;
}

export interface RenderSpecBase<K extends ContentKind> {
  kind: K;
  meta?: ContentMeta;
}

export interface MdxRenderSpec extends RenderSpecBase<"mdx"> {
  body: FC<{ components?: MDXComponents }>;
  toc: TableOfContents;
  source?: string;
}

export interface PdfRenderSpec extends RenderSpecBase<"pdf"> {
  pdfUrl: string;
  downloadUrl?: string;
}

export interface TextRenderSpec extends RenderSpecBase<"text"> {
  text: string;
}

export interface ImageRenderSpec extends RenderSpecBase<"image"> {
  images: { url: string; alt?: string; id: string }[];
}

export interface JsonRenderSpec extends RenderSpecBase<"json"> {
  raw: string;
  parsed?: unknown;
}

export interface MediaRenderSpec extends RenderSpecBase<"audio" | "video"> {
  sources: { url: string; type?: string }[];
  posterUrl?: string;
  durationSeconds?: number;
}

export interface SmartBundleRenderSpec extends RenderSpecBase<"smartBundle"> {
  key: string;
  primaryData?: JsonRenderSpec | TextRenderSpec;
  gallery?: ImageRenderSpec;
  media?: MediaRenderSpec;
  attachments?: TextRenderSpec[];
}

export interface FallbackRenderSpec extends RenderSpecBase<"fallback"> {
  reason: string;
}

export type RenderSpec =
  | MdxRenderSpec
  | PdfRenderSpec
  | TextRenderSpec
  | ImageRenderSpec
  | JsonRenderSpec
  | MediaRenderSpec
  | SmartBundleRenderSpec
  | FallbackRenderSpec;

export interface AdapterResult {
  kind: ContentKind;
  meta: ContentMeta;
  renderSpec: RenderSpec;
  cachePolicy?: CachePolicy;
}

export interface AdapterContext {
  client: {
    downloadText(fileId: string): Promise<string>;
    getPreviewUrl(fileId: string, mimeType?: string): Promise<string>;
    getExportUrl?(fileId: string, mimeType?: string): Promise<string>;
  };
  defaults?: CachePolicy & { titleFallbackPrefix?: string };
}

export type AdapterTarget = DriveLocator | BundleDescriptor;

export interface ContentAdapter<T extends AdapterTarget = AdapterTarget> {
  kind: ContentKind;
  match(target: AdapterTarget): target is T;
  load(target: T, context: AdapterContext): Promise<AdapterResult>;
}
