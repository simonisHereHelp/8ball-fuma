import type {
  AdapterResult,
  DriveLocator,
  ContentAdapter,
} from "./content-adapter";

const MEDIA_EXT = /\.(mp3|mp4|wav|mov|m4a)$/i;

export const mediaAdapter: ContentAdapter<DriveLocator> = {
  kind: "video",
  match(target) {
    return (
      "name" in target &&
      (MEDIA_EXT.test(target.name) || target.mimeType?.startsWith("audio/") || target.mimeType?.startsWith("video/"))
    );
  },
  async load(locator, context): Promise<AdapterResult> {
    const url = await context.client.getPreviewUrl(locator.id, locator.mimeType);

    return {
      kind: locator.mimeType?.startsWith("audio/") ? "audio" : "video",
      meta: { title: locator.name, modifiedTime: locator.modifiedTime },
      cachePolicy: { revalidate: context.defaults?.revalidate ?? 120 },
      renderSpec: {
        kind: locator.mimeType?.startsWith("audio/") ? "audio" : "video",
        sources: [{ url, type: locator.mimeType }],
      },
    };
  },
};
