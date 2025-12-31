import type { DriveLocator } from "../adapter/content-adapter";
import { toLocator, type DriveClient, type DriveFile } from "./client";

export interface CatalogOptions {
  mimeAllowlist?: string[];
}

export async function walkDriveCatalog(
  client: DriveClient,
  rootFolderId: string,
  options: CatalogOptions = {},
): Promise<DriveLocator[]> {
  const results: DriveLocator[] = [];

  async function walk(folderId: string, path: string[]) {
    const files = await client.listChildren(folderId);

    for (const file of files as DriveFile[]) {
      if (!file.id || !file.name) continue;
      if (options.mimeAllowlist && file.mimeType && !options.mimeAllowlist.includes(file.mimeType)) {
        continue;
      }

      const currentPath = [...path, file.name];
      const locator = toLocator(file, currentPath);
      results.push(locator);

      if (file.mimeType === "application/vnd.google-apps.folder") {
        await walk(file.id, currentPath);
      }
    }
  }

  await walk(rootFolderId, []);
  return results;
}
