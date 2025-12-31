import { contentCache } from "../cache/content-cache";
import { groupSmartContent } from "../drive/smart-grouper";
import { loadContent } from "../adapter";
import { walkDriveCatalog } from "../drive/catalog";
import type {
  AdapterContext,
  AdapterResult,
  BundleDescriptor,
} from "../adapter/content-adapter";
import type { DriveClient } from "../drive/client";

export interface AssembleOptions {
  rootFolderId: string;
  slug: string[];
  context: AdapterContext & { client: DriveClient };
  enableSmartBundles?: boolean;
}

export async function assembleRenderSpec(options: AssembleOptions): Promise<AdapterResult | null> {
  const { rootFolderId, slug, context, enableSmartBundles } = options;
  const cacheKey = slug.join("/");
  const cached = contentCache.get(cacheKey);
  if (cached) return cached;

  const locators = await walkDriveCatalog(context.client, rootFolderId);
  let target = locators.find((locator) => locator.path.join("/") === slug.join("/"));

  let bundleTarget: BundleDescriptor | undefined;
  if (!target && enableSmartBundles) {
    const bundles = groupSmartContent(locators);
    bundleTarget = bundles.find((bundle) => bundle.key === slug.join("/"));
  }

  const adapterTarget = (target ?? bundleTarget) as typeof target | typeof bundleTarget;
  if (!adapterTarget) return null;

  const result = await loadContent(adapterTarget, context);
  contentCache.set(cacheKey, result);
  return result;
}
