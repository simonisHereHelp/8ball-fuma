import type {
  AdapterResult,
  DriveLocator,
  ContentAdapter,
} from "./content-adapter";

const IMAGE_EXT = /\.(png|jpe?g)$/i;

export const imageAdapter: ContentAdapter<DriveLocator> = {
  kind: "image",
  match(target) {
    return "name" in target && (IMAGE_EXT.test(target.name) || target.mimeType?.startsWith("image/"));
  },
  async load(locator, context): Promise<AdapterResult> {
    const url = await context.client.getPreviewUrl(locator.id, locator.mimeType);

    return {
      kind: "image",
      meta: { title: locator.name, modifiedTime: locator.modifiedTime },
      cachePolicy: { revalidate: context.defaults?.revalidate ?? 300 },
      renderSpec: {
        kind: "image",
        images: [{ url, alt: locator.name, id: locator.id }],
      },
    };
  },
};
