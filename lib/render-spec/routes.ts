import type { AdapterResult } from "../adapter/content-adapter";
import { DriveClient } from "../drive/client";
import { assembleRenderSpec } from "./assembler";

export interface RouteOptions {
  rootFolderId: string;
  accessToken?: string;
  enableSmartBundles?: boolean;
}

export function createRenderSpecRoutes(options: RouteOptions) {
  const client = new DriveClient({ accessToken: options.accessToken });

  return {
    async getPage(slug: string[]): Promise<AdapterResult | null> {
      return assembleRenderSpec({
        rootFolderId: options.rootFolderId,
        slug,
        enableSmartBundles: options.enableSmartBundles,
        context: { client },
      });
    },
    async generateParams() {
      return [] as { slug?: string[] }[];
    },
  };
}
