import type {
  AdapterResult,
  BundleDescriptor,
  JsonRenderSpec,
  TextRenderSpec,
  ContentAdapter,
} from "./content-adapter";

export const smartBundleAdapter: ContentAdapter<BundleDescriptor> = {
  kind: "smartBundle",
  match(target): target is BundleDescriptor {
    return "key" in target && Array.isArray((target as BundleDescriptor).assets);
  },
  async load(bundle, context): Promise<AdapterResult> {
    let primaryData: JsonRenderSpec | TextRenderSpec | undefined;

    if (bundle.primaryData) {
      const raw = await context.client.downloadText(bundle.primaryData.id);
      if (bundle.primaryData.name.endsWith(".json")) {
        primaryData = { kind: "json", raw, parsed: JSON.parse(raw) };
      } else {
        primaryData = { kind: "text", text: raw };
      }
    }

    const galleryAssets = bundle.assets.filter((asset) => asset.role === "image");
    const mediaAssets = bundle.assets.filter((asset) => asset.role === "media");

    const gallery = galleryAssets.length
      ? {
          kind: "image" as const,
          images: await Promise.all(
            galleryAssets.map(async (asset) => ({
              id: asset.locator.id,
              alt: asset.locator.name,
              url: await context.client.getPreviewUrl(asset.locator.id, asset.locator.mimeType),
            })),
          ),
        }
      : undefined;

    const media = mediaAssets.length
      ? {
          kind: "video" as const,
          sources: await Promise.all(
            mediaAssets.map(async (asset) => ({
              url: await context.client.getPreviewUrl(asset.locator.id, asset.locator.mimeType),
              type: asset.locator.mimeType,
            })),
          ),
        }
      : undefined;

    const attachments = bundle.attachments?.length
      ? await Promise.all(
          bundle.attachments.map(async (attachment) => ({
            kind: "text" as const,
            text: await context.client.downloadText(attachment.id),
          })),
        )
      : undefined;

    return {
      kind: "smartBundle",
      meta: { title: bundle.label },
      cachePolicy: { revalidate: context.defaults?.revalidate ?? 120 },
      renderSpec: {
        kind: "smartBundle",
        key: bundle.key,
        primaryData,
        gallery,
        media,
        attachments,
      },
    };
  },
};
