import { compile } from "../compile-md";
import type {
  AdapterContext,
  AdapterResult,
  ContentMeta,
  DriveLocator,
  ContentAdapter,
} from "./content-adapter";

function buildMeta(locator: DriveLocator, compiledMeta?: Partial<ContentMeta>): ContentMeta {
  return {
    title: compiledMeta?.title ?? locator.name,
    description: compiledMeta?.description,
    modifiedTime: locator.modifiedTime,
    size: locator.size,
  };
}

export const mdxAdapter: ContentAdapter<DriveLocator> = {
  kind: "mdx",
  match(target) {
    return "name" in target && /\.mdx?$/i.test(target.name);
  },
  async load(locator, context): Promise<AdapterResult> {
    const source = await context.client.downloadText(locator.id);
    const compiled = await compile(locator.path.join("/"), source);
    const meta = buildMeta(locator, compiled);

    return {
      kind: "mdx",
      meta,
      cachePolicy: { revalidate: context.defaults?.revalidate ?? 30 },
      renderSpec: {
        kind: "mdx",
        body: compiled.body,
        toc: compiled.toc,
        source,
        meta,
      },
    };
  },
};
