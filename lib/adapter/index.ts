import type {
  AdapterContext,
  AdapterResult,
  AdapterTarget,
  BundleDescriptor,
  ContentAdapter,
  ContentKind,
  DriveLocator,
} from "./content-adapter";
import { mdxAdapter } from "./mdx-adapter";
import { pdfAdapter } from "./pdf-adapter";
import { textAdapter } from "./text-adapter";
import { imageAdapter } from "./image-adapter";
import { jsonAdapter } from "./json-adapter";
import { mediaAdapter } from "./media-adapter";
import { smartBundleAdapter } from "./smart-bundle-adapter";

const registry: ContentAdapter[] = [
  smartBundleAdapter,
  mdxAdapter,
  pdfAdapter,
  textAdapter,
  imageAdapter,
  jsonAdapter,
  mediaAdapter,
];

export function getAdapterFor(target: AdapterTarget): ContentAdapter | null {
  return registry.find((adapter) => adapter.match(target)) ?? null;
}

export async function loadContent(target: AdapterTarget, context: AdapterContext): Promise<AdapterResult> {
  const adapter = getAdapterFor(target);
  if (!adapter) {
    return {
      kind: "fallback",
      meta: {},
      renderSpec: { kind: "fallback", reason: "Unsupported content" },
      cachePolicy: { revalidate: 30 },
    };
  }

  return adapter.load(target as never, context);
}

export function listAdapters() {
  return registry.map((adapter) => adapter.kind);
}
