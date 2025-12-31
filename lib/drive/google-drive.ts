import type { Source, VirtualFile } from "fumadocs-core/source";
import { compile, type CompiledPage } from "../compile-md";
import { compilePdf } from "../compilePdf";
import * as path from "node:path";
import { getTitleFromFile } from "../source";
import { meta } from "../meta";
import { auth } from "../../auth";

const docsFolderId = process.env.DRIVE_FOLDER_ID;

if (!docsFolderId) throw new Error(`environment variable DRIVE_FOLDER_ID is needed.`);

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
};

const DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder";

async function listFolder(folder: string, accessToken: string): Promise<DriveFile[]> {
  const out: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: `'${folder}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType)",
      pageSize: "1000",
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}` , {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 30 },
    });
  //   { cache: "no-store" }, or  { cache: "force-cache" }
    if (!res.ok) {
      throw new Error(await res.text());
    }

    const data = (await res.json()) as {
      nextPageToken?: string;
      files: DriveFile[];
    };

    out.push(...data.files);
    pageToken = data.nextPageToken;
  } while (pageToken);

  return out;
}

async function fetchFileContent(fileId: string, accessToken: string): Promise<string> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 30 },
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return await res.text();
}

// Add this helper to generate a URL that Google allows to be iframed
function getDriveViewUrl(fileId: string) {
  return `https://drive.google.com/file/d/${fileId}/view`;
}


async function listDocsFiles(folderId: string, accessToken: string, prefix = ""): Promise<VirtualFile[]> {
  const files = await listFolder(folderId, accessToken);
  const out: VirtualFile[] = [];

  const supportedExt = new Set([".md", ".mdx", ".pdf", ".txt"]); // ✅ Only these appear in nav/pageTree

  for (const file of files) {
    if (file.mimeType === DRIVE_FOLDER_MIME) {
      const nextPrefix = prefix ? `${prefix}/${file.name}` : file.name;
      out.push(...(await listDocsFiles(file.id, accessToken, nextPrefix)));
      continue;
    }

    // ✅ Exclude JPEG/PNG/etc from nav
    if (
      file.mimeType.startsWith("image/") ||
      file.mimeType.startsWith("video/") ||
      file.mimeType.startsWith("audio/") 
    ) {
      continue;
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!supportedExt.has(ext)) continue;

    const filePath = prefix ? `${prefix}/${file.name}` : file.name;

    out.push({
      type: "page",
      path: filePath,
      data: {
        title: getTitleFromFile(filePath),
        async load() {

          if (file.mimeType === "application/pdf" || ext === ".pdf") {
            return compilePdf(filePath, {
              url: getDriveViewUrl(file.id),
              title: getTitleFromFile(filePath),
            });
          }

          const content = await fetchFileContent(file.id, accessToken);
          return compile(filePath, content);
        },
      },
    } satisfies VirtualFile);
  }

  return out;
}

export async function createGoogleDriveSource(): Promise<
  Source<{
    metaData: { title: string; pages: string[] };
    pageData: {
      title: string;
      load: () => Promise<CompiledPage>;
    };
  }>
> {
  const session = await auth();
  const accessToken = (session as any)?.AccessToken ?? (session as any)?.accessToken;

  if (!accessToken) {
    throw new Error("Drive access requires a signed-in session with session.AccessToken");
  }

  const pages = await listDocsFiles(docsFolderId, accessToken);

  return {
    files: [...pages, ...meta],
  };
}