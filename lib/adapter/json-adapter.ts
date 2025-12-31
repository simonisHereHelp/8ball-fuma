import type {
  AdapterResult,
  DriveLocator,
  ContentAdapter,
} from "./content-adapter";

export const jsonAdapter: ContentAdapter<DriveLocator> = {
  kind: "json",
  match(target) {
    return "name" in target && target.name.toLowerCase().endsWith(".json");
  },
  async load(locator, context): Promise<AdapterResult> {
    const raw = await context.client.downloadText(locator.id);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = undefined;
    }

    return {
      kind: "json",
      meta: { title: locator.name, modifiedTime: locator.modifiedTime },
      cachePolicy: { revalidate: context.defaults?.revalidate ?? 15 },
      renderSpec: { kind: "json", raw, parsed },
    };
  },
};
