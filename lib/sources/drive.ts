import type { Source, VirtualFile } from "fumadocs-core/source";
import { compile, type CompiledPage } from "../compile-md";
import { getTitleFromFile } from "../source";
import { driveCategories, meta } from "../meta";
import { auth, getAccessToken } from "@/auth";
import { getDriveManifest } from "@/lib/sources/manifest";

const folderNames = [...driveCategories];

const driveBaseUrl = "https://www.googleapis.com/drive/v3/files";
type ManifestFile = {
  name: string;
  mime: string;
};

function isSupportedDoc(name: string) {
  const lower = name.toLowerCase();
  return lower.endsWith(".md") || lower.endsWith(".mdx") || lower.endsWith(".txt");
}

async function fetchFileContent(fileId: string, accessToken: string) {
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

  return await res.text();
}

export async function createDriveSource(): Promise<
  Source<{
    metaData: { title: string; pages: string[] };
    pageData: {
      title: string;
      load: () => Promise<CompiledPage>;
      pageTreeNo?: number;
    };
  }>
> {
  console.info("[drive] Initializing Drive source.");
  const session = await auth();
  const accessToken = getAccessToken(session);

  if (!accessToken) {
    console.warn("[drive] No access token found; returning metadata only.");
    return {
      files: [...meta],
    };
  }

  const manifest = await getDriveManifest(accessToken);
  const pages: VirtualFile[] = [];
  const folderMeta: VirtualFile[] = [];
  let pageTreeNo = 0;

  for (const folderName of folderNames) {
    console.info(`[drive] Loading folder: ${folderName}`);
    const folderKey = `docs/${folderName}`;
    const tree = manifest.tree[folderKey];
    if (!manifest.folders[folderKey] || !tree) {
      console.error(`[drive] Missing manifest mapping for: ${folderKey}`);
      throw new Error(`Manifest missing folder: ${folderKey}`);
    }

    folderMeta.push({
      type: "meta",
      path: `${folderName}/meta.json`,
      data: {
        title: folderName,
        root: true,
        pages: ["index", "..."],
      },
    });

    const files = tree
      .map((id) => ({ id, file: manifest.files[id] }))
      .filter((entry): entry is { id: string; file: ManifestFile } =>
        Boolean(entry.file),
      );
    console.info(
      `[drive] Found ${files.length} files in ${folderName}.`,
    );

    for (const entry of files) {
      if (!isSupportedDoc(entry.file.name)) {
        continue;
      }

      const currentTreeNo = pageTreeNo;
      const virtualPath = `${folderName}/${currentTreeNo}: ${entry.file.name}`;

      pages.push({
        type: "page",
        path: virtualPath,
        data: {
          title: getTitleFromFile(virtualPath),
          pageTreeNo: pageTreeNo++,
          async load() {
            console.info(`[drive] Loading file: ${virtualPath}`);
            const content = await fetchFileContent(entry.id, accessToken);
            console.info(`[drive] Compiling file: ${virtualPath}`);
            return compile(virtualPath, content);
          },
        },
      } satisfies VirtualFile);
    }
  }

  console.info(`[drive] Completed source with ${pages.length} pages.`);
  return {
    files: [...pages, ...folderMeta, ...meta],
  };
}
