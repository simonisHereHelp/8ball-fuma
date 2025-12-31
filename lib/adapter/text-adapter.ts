import type {
  AdapterResult,
  DriveLocator,
  ContentAdapter,
} from "./content-adapter";

export const textAdapter: ContentAdapter<DriveLocator> = {
  kind: "text",
  match(target) {
    return "name" in target && target.name.toLowerCase().endsWith(".txt");
  },
  async load(locator, context): Promise<AdapterResult> {
    const text = await context.client.downloadText(locator.id);
    return {
      kind: "text",
      meta: { title: locator.name, modifiedTime: locator.modifiedTime },
      cachePolicy: { revalidate: context.defaults?.revalidate ?? 30 },
      renderSpec: { kind: "text", text },
    };
  },
};
