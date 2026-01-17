import { auth, getAccessToken } from "@/auth";

export type DriveManifest = {
  folders: Record<string, string>;
  tree: Record<string, string[]>;
  files: Record<string, { name: string; mime: string }>;
  inlineAssets?: Record<string, Record<string, string>>;
  updatedAt?: number;
};

const driveBaseUrl = "https://www.googleapis.com/drive/v3/files";
const manifestFileId = "manifest.json";

let cachedManifest: DriveManifest | null = null;

async function fetchManifest(fileId: string, accessToken: string): Promise<DriveManifest> {
  const url = `${driveBaseUrl}/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    next: { revalidate: 30 },
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return (await res.json()) as DriveManifest;
}

export async function getDriveManifest(): Promise<DriveManifest> {
  const session = await auth();
  const accessToken = getAccessToken(session);

  if (!accessToken) {
    throw new Error("Unauthorized: missing access token.");
  }

  if (!cachedManifest) {
    cachedManifest = await fetchManifest(manifestFileId, accessToken);
    return cachedManifest;
  }

  const latestManifest = await fetchManifest(manifestFileId, accessToken);
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
