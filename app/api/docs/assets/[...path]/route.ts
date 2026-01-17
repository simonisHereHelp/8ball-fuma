import { auth, getAccessToken } from "@/auth";
import { getDriveManifest } from "@/lib/sources/manifest";

const driveBaseUrl = "https://www.googleapis.com/drive/v3/files";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;

  if (!path?.length) {
    return new Response("Missing asset path.", { status: 400 });
  }

  const session = await auth();
  const accessToken = getAccessToken(session);

  if (!accessToken) {
    return new Response("Unauthorized.", { status: 401 });
  }

  const url = new URL(req.url);
  const docName = url.searchParams.get("doc");
  const folderName = path[0];
  const folderKey = `docs/${folderName}`;
  const assetPath = path.slice(1).join("/");
  const assetName = path[path.length - 1];

  try {
    const manifest = await getDriveManifest(accessToken);
    const tree = manifest.tree[folderKey] ?? [];
    const files = manifest.files;
    let assetFileId: string | null = null;

    if (docName) {
      const docId = tree.find((id) => files[id]?.name === docName);
      const inlineMap = docId ? manifest.inlineAssets?.[docId] : undefined;
      const inlineKey = assetPath ? `./${assetPath}` : `./${assetName}`;
      assetFileId = inlineMap?.[inlineKey] ?? null;
    }

    if (!assetFileId) {
      assetFileId = tree.find((id) => files[id]?.name === assetName) ?? null;
    }

    if (!assetFileId) {
      return new Response("Not found.", { status: 404 });
    }

    const downloadUrl = `${driveBaseUrl}/${assetFileId}?alt=media`;
    const assetResponse = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      next: { revalidate: 3600 },
    });

    if (!assetResponse.ok || !assetResponse.body) {
      return new Response(await assetResponse.text(), {
        status: assetResponse.status,
      });
    }

    const headers = new Headers();
    const contentType = assetResponse.headers.get("content-type");
    const contentLength = assetResponse.headers.get("content-length");

    if (contentType) {
      headers.set("content-type", contentType);
    }
    if (contentLength) {
      headers.set("content-length", contentLength);
    }

    headers.set(
      "cache-control",
      "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    );

    return new Response(assetResponse.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("[docs-assets] Failed to resolve asset.", error);
    return new Response("Failed to resolve asset.", { status: 500 });
  }
}
