import type {
  BundleDescriptor,
  BundleAsset,
  DriveLocator,
} from "../adapter/content-adapter";

function stemFromName(name: string): string | null {
  const match = /^(.+?)_[^_]+(?:_\d+)?\.[^.]+$/u.exec(name);
  return match ? match[1] : null;
}

export function groupSmartContent(locators: DriveLocator[]): BundleDescriptor[] {
  const groups = new Map<string, BundleDescriptor>();

  for (const locator of locators) {
    const stem = stemFromName(locator.name);
    if (!stem) continue;

    const entry = groups.get(stem) ?? {
      key: stem,
      label: stem,
      assets: [],
    };

    const role: BundleAsset["role"] = locator.mimeType?.includes("image")
      ? "image"
      : locator.mimeType?.includes("audio") || locator.mimeType?.includes("video")
        ? "media"
        : locator.name.endsWith(".json")
          ? "primary"
          : "attachment";

    entry.assets.push({ locator, role });

    if (role === "primary") {
      entry.primaryData = locator;
    }

    groups.set(stem, entry);
  }

  return [...groups.values()].map((group) => ({
    ...group,
    attachments: group.assets.filter((asset) => asset.role === "attachment").map((asset) => asset.locator),
  }));
}
