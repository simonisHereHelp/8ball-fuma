export type DriveManifest = {
  folders: Record<string, string>;
  tree: Record<string, string[]>;
  files: Record<string, { name: string; mime: string }>;
  inlineAssets?: Record<string, Record<string, string>>;
  updatedAt?: number;
};

const driveBaseUrl = "https://www.googleapis.com/drive/v3/files";

let cachedManifest: DriveManifest | null = null;

async function fetchManifest(accessToken: string): Promise<DriveManifest> {
  const manifestFileId = process.env.DRIVE_MANIFEST_FILE_ID;

  if (!manifestFileId) {
    throw new Error("DRIVE_MANIFEST_FILE_ID environment variable is required.");
  }

  const url = `${driveBaseUrl}/${manifestFileId}?alt=media`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return (await res.json()) as DriveManifest;
}

export async function getDriveManifest(
  accessToken: string,
): Promise<DriveManifest> {
  if (!cachedManifest) {
    cachedManifest = await fetchManifest(accessToken);
    return cachedManifest;
  }

  const latestManifest = await fetchManifest(accessToken);
  const latestUpdatedAt = latestManifest.updatedAt;
  const cachedUpdatedAt = cachedManifest.updatedAt;

  if (typeof latestUpdatedAt === "number" && typeof cachedUpdatedAt === "number") {
    if (latestUpdatedAt !== cachedUpdatedAt) {
      cachedManifest = latestManifest;
    }
    return cachedManifest;
  }

  cachedManifest = latestManifest;

  return cachedManifest;
}
