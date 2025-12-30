import type { Source, VirtualFile } from "fumadocs-core/source";
import { compile, type CompiledPage } from "../compile-md";
import { compilePdf } from "../compilePdf";
import * as path from "node:path";
import { getTitleFromFile } from "../source";
import { meta } from "../meta";

const folderId = process.env.DRIVE_FOLDER_ID_PARENT ?? "1QZIlGdbY2YPBQrgdmWILdE2ITA-YtdEW";
const apiKey = 'AIzaSyAMpDmSFyTWB_90ZJWcBiIaXX8-1srgTew';

if (!folderId) throw new Error(`environment variable DRIVE_FOLDER_ID is needed.`);
if (!apiKey) throw new Error(`environment variable GOOGLE_API_KEY is needed.`);

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
};

const DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder";

async function listFolder(folder: string): Promise<DriveFile[]> {
  const out: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: `'${folder}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType)",
      pageSize: "1000",
      key: apiKey,
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
       { next: { revalidate: 30 } }
    );
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

async function fetchFileContent(fileId: string): Promise<string> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`,
     { next: { revalidate: 30 } }
  );

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return await res.text();
}

// Add this helper to generate a URL that Google allows to be iframed
function getDriveViewUrl(fileId: string) {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

function getFileUrl(fileId: string) {
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
}


async function findDocsFolder(): Promise<DriveFile> {
  const files = await listFolder(folderId);
  const docs = files.find(
    (file) => file.name === "docs" && file.mimeType === DRIVE_FOLDER_MIME,
  );

  if (!docs) {
    throw new Error("Failed to find docs folder in Google Drive");
  }

  return docs;
}

async function listDocsFiles(docsFolderId: string, prefix = ""): Promise<VirtualFile[]> {
  const files = await listFolder(docsFolderId);
  const out: VirtualFile[] = [];

  const supportedExt = new Set([".md", ".mdx", ".pdf", ".txt"]); // ✅ Only these appear in nav/pageTree

  for (const file of files) {
    if (file.mimeType === DRIVE_FOLDER_MIME) {
      const nextPrefix = prefix ? `${prefix}/${file.name}` : file.name;
      out.push(...(await listDocsFiles(file.id, nextPrefix)));
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

          const content = await fetchFileContent(file.id);
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
  const docsFolder = await findDocsFolder();
  const pages = await listDocsFiles(docsFolder.id);

  return {
    files: [...pages, ...meta],
  };
}