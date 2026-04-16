import type { Source, VirtualFile } from "fumadocs-core/source";
import { compile, type CompiledPage } from "../compile-md";
import { getTitleFromFile } from "../source";
import {
  buildDriveRootMeta,
  DRIVE_ACTIVE_SUBFOLDER_LIST_FILE,
  parseDriveActiveSubfolders,
} from "../drive-active-subfolder-list";
import { auth, getAccessToken } from "@/auth";

const driveBaseUrl = "https://www.googleapis.com/drive/v3/files";

type DriveFile = {
  id: string;
  name: string;
  mimeType?: string;
};

type DriveListResponse = {
  files: DriveFile[];
};

async function driveFetch<T>(url: string, accessToken: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    next: { revalidate: 30 },
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return (await res.json()) as T;
}

async function listFolderByName(
  rootId: string,
  name: string,
  accessToken: string,
) {
  const params = new URLSearchParams({
    q: `'${rootId}' in parents and mimeType = 'application/vnd.google-apps.folder' and name = '${name}' and trashed = false`,
    fields: "files(id,name)",
    pageSize: "1",
  });

  const url = `${driveBaseUrl}?${params.toString()}`;
  const data = await driveFetch<DriveListResponse>(url, accessToken);
  return data.files[0];
}

async function listFileByName(
  parentId: string,
  name: string,
  accessToken: string,
) {
  const params = new URLSearchParams({
    q: `'${parentId}' in parents and mimeType != 'application/vnd.google-apps.folder' and name = '${name}' and trashed = false`,
    fields: "files(id,name,mimeType)",
    pageSize: "1",
  });

  const url = `${driveBaseUrl}?${params.toString()}`;
  const data = await driveFetch<DriveListResponse>(url, accessToken);
  return data.files[0];
}

async function listFilesInFolder(folderId: string, accessToken: string) {
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id,name,mimeType)",
    pageSize: "1000",
  });

  const url = `${driveBaseUrl}?${params.toString()}`;
  const data = await driveFetch<DriveListResponse>(url, accessToken);
  return data.files;
}

function isSupportedDoc(name: string) {
  const lower = name.toLowerCase();
  return lower.endsWith(".md") || lower.endsWith(".mdx") || lower.endsWith(".txt");
}

function orderFilesForTree(files: DriveFile[]) {
  const indexFiles = files.filter((file) =>
    /^index\.(md|mdx|txt)$/i.test(file.name),
  );
  const otherFiles = files.filter(
    (file) => !/^index\.(md|mdx|txt)$/i.test(file.name),
  );
  return [...indexFiles, ...otherFiles];
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

async function findDriveActiveSubfolderListFile(
  rootId: string,
  accessToken: string,
) {
  const directFile = await listFileByName(
    rootId,
    DRIVE_ACTIVE_SUBFOLDER_LIST_FILE,
    accessToken,
  );

  if (directFile) {
    return directFile;
  }

  for (const folderName of ["doc", "docs"]) {
    const folder = await listFolderByName(rootId, folderName, accessToken);
    if (!folder) {
      continue;
    }

    const nestedFile = await listFileByName(
      folder.id,
      DRIVE_ACTIVE_SUBFOLDER_LIST_FILE,
      accessToken,
    );

    if (nestedFile) {
      return nestedFile;
    }
  }

  return null;
}

async function getDriveCategories(rootId: string, accessToken: string) {
  const categoryFile = await findDriveActiveSubfolderListFile(rootId, accessToken);

  if (!categoryFile) {
    throw new Error(
      `Drive file not found: ${DRIVE_ACTIVE_SUBFOLDER_LIST_FILE}`,
    );
  }

  const raw = await fetchFileContent(categoryFile.id, accessToken);
  const categories = parseDriveActiveSubfolders(raw);

  if (categories.length === 0) {
    throw new Error(
      `Drive file ${DRIVE_ACTIVE_SUBFOLDER_LIST_FILE} did not contain any topics.`,
    );
  }

  return categories;
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
  const rootId = process.env.DRIVE_FOLDER_ID;

  if (!rootId) {
    console.error("[drive] Missing DRIVE_FOLDER_ID.");
    throw new Error("DRIVE_FOLDER_ID environment variable is required.");
  }

  if (!accessToken) {
    console.warn("[drive] No access token found; returning metadata only.");
    return {
      files: [...buildDriveRootMeta([])],
    };
  }

  const folderNames = await getDriveCategories(rootId, accessToken);
  const meta = buildDriveRootMeta(folderNames);
  const pages: VirtualFile[] = [];
  const folderMeta: VirtualFile[] = [];
  let pageTreeNo = 0;

  for (const folderName of folderNames) {
    console.info(`[drive] Loading folder: ${folderName}`);
    const folder = await listFolderByName(rootId, folderName, accessToken);
    if (!folder) {
      console.error(`[drive] Folder not found: ${folderName}`);
      throw new Error(`Drive folder not found: ${folderName}`);
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

    const files = orderFilesForTree(
      await listFilesInFolder(folder.id, accessToken),
    );
    console.info(
      `[drive] Found ${files.length} files in ${folderName}.`,
    );

    for (const file of files) {
      if (!isSupportedDoc(file.name)) {
        continue;
      }

      const currentTreeNo = pageTreeNo;
      const virtualPath = `${folderName}/${currentTreeNo}: ${file.name}`;

      pages.push({
        type: "page",
        path: virtualPath,
        data: {
          title: getTitleFromFile(virtualPath),
          pageTreeNo: pageTreeNo++,
          async load() {
            console.info(`[drive] Loading file: ${virtualPath}`);
            const content = await fetchFileContent(file.id, accessToken);
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
