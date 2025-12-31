import dynamic from "next/dynamic";
import type { MDXComponents } from "mdx/types";
import type { RenderSpec } from "@/lib/adapter/content-adapter";
import { MdxBody } from "./MdxBody";
import { TextBody } from "./TextBody";
import { ImageGallery } from "./ImageGallery";
import { JsonViewer } from "./JsonViewer";
import { MediaPlayer } from "./MediaPlayer";
import { SmartBundleView } from "./SmartBundleView";

const PdfViewer = dynamic(() => import("../docs/PdfViewer.client"), { ssr: false });

type Renderer = (props: { spec: RenderSpec; components?: MDXComponents }) => JSX.Element | null;

const registry: Record<RenderSpec["kind"], Renderer> = {
  mdx: ({ spec, components }) => <MdxBody spec={spec} components={components} />,
  pdf: ({ spec }) => <PdfViewer url={spec.pdfUrl} downloadUrl={spec.downloadUrl} />,
  text: ({ spec }) => <TextBody spec={spec} />,
  image: ({ spec }) => <ImageGallery spec={spec} />,
  json: ({ spec }) => <JsonViewer spec={spec} />,
  audio: ({ spec }) => <MediaPlayer spec={spec} />,
  video: ({ spec }) => <MediaPlayer spec={spec} />,
  smartBundle: ({ spec }) => <SmartBundleView spec={spec} />,
  fallback: ({ spec }) => (
    <div className="rounded-md border bg-muted p-4 text-sm text-muted-foreground">{spec.reason}</div>
  ),
};

export function getRenderer(kind: RenderSpec["kind"]): Renderer {
  return registry[kind];
}

export function RenderBySpec({ spec, components }: { spec: RenderSpec; components?: MDXComponents }) {
  const Renderer = getRenderer(spec.kind) ?? registry.fallback;
  return <Renderer spec={spec} components={components} />;
}
