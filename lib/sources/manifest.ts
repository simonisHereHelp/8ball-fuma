import { auth, getAccessToken } from "@/auth";

export type DriveManifest = {
  folders: Record<string, string>;
  tree: Record<string, string[]>;
  files: Record<string, { name: string; mime: string }>;
  inlineAssets?: Record<string, Record<string, string>>;
  updatedAt?: number;
};

const driveBaseUrl = "https://www.googleapis.com/drive/v3/files";
const manifestFileId =
  process.env.DRIVE_MANIFEST_FILE_ID ?? process.env.DRIVE_MANIFEST_ID;

let cachedManifest: DriveManifest | null = null;

async function fetchManifest(accessToken: string): Promise<DriveManifest> {
  if (!manifestFileId) {
    throw new Error(
      "Missing DRIVE_MANIFEST_FILE_ID. Set it to the Google Drive file ID for manifest.json.",
    );
  }

  const url = `${driveBaseUrl}/${manifestFileId}?alt=media`;
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

export async function getDriveManifest(
  providedAccessToken?: string,
): Promise<DriveManifest> {
  const accessToken = providedAccessToken ?? getAccessToken(await auth());

  if (!accessToken) {
    throw new Error("Unauthorized: missing access token.");
  }

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
