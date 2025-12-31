const DRIVE_BASE_URL = "https://www.googleapis.com/drive/v3";

type Fetcher = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

export interface DriveClientConfig {
  accessToken: string;
  fetchImpl?: Fetcher;
}

export interface DriveFile {
  id?: string;
  name?: string;
  mimeType?: string;
  modifiedTime?: string;
  size?: string | number;
  webViewLink?: string;
  parents?: string[];
}

export class DriveClient {
  private readonly accessToken: string;
  private readonly fetchImpl: Fetcher;

  constructor(config: DriveClientConfig) {
    if (!config?.accessToken) {
      throw new Error("DriveClient requires an access token from NextAuth session.AccessToken");
    }

    this.accessToken = config.accessToken;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
    } satisfies HeadersInit;
  }

  async listChildren(
    folderId: string,
    fields = "files(id,name,mimeType,modifiedTime,size,webViewLink,parents),nextPageToken",
  ): Promise<DriveFile[]> {
    const files: DriveFile[] = [];
    let pageToken: string | undefined;

    do {
      const params = new URLSearchParams({
        q: `'${folderId}' in parents and trashed = false`,
        fields,
        pageSize: "1000",
        supportsAllDrives: "true",
        includeItemsFromAllDrives: "true",
      });

      if (pageToken) params.set("pageToken", pageToken);

      const res = await this.fetchImpl(`${DRIVE_BASE_URL}/files?${params.toString()}`, {
        headers: this.headers(),
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(`Drive listChildren failed: ${res.status} ${message}`);
      }

      const data = (await res.json()) as { files?: DriveFile[]; nextPageToken?: string };
      files.push(...(data.files ?? []));
      pageToken = data.nextPageToken ?? undefined;
    } while (pageToken);

    return files;
  }

  async getFile(
    fileId: string,
    fields = "id,name,mimeType,modifiedTime,size,webViewLink,parents",
  ): Promise<DriveFile | null> {
    const params = new URLSearchParams({
      fields,
      supportsAllDrives: "true",
    });

    const res = await this.fetchImpl(`${DRIVE_BASE_URL}/files/${fileId}?${params.toString()}`, {
      headers: this.headers(),
    });

    if (res.status === 404) return null;
    if (!res.ok) {
      const message = await res.text();
      throw new Error(`Drive getFile failed: ${res.status} ${message}`);
    }

    return (await res.json()) as DriveFile;
  }

  async downloadText(fileId: string): Promise<string> {
    const res = await this.fetchImpl(`${DRIVE_BASE_URL}/files/${fileId}?alt=media`, {
      headers: this.headers(),
    });

    if (!res.ok) {
      const message = await res.text();
      throw new Error(`Drive downloadText failed: ${res.status} ${message}`);
    }

    return await res.text();
  }

  getPreviewUrl(fileId: string, mimeType?: string) {
    if (mimeType === "application/pdf") {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return `https://drive.google.com/uc?id=${fileId}`;
  }

  getExportUrl(fileId: string, mimeType = "application/pdf") {
    return `https://drive.google.com/uc?id=${fileId}&export=${encodeURIComponent(mimeType)}`;
  }
}

export function toLocator(file: DriveFile, path: string[]) {
  return {
    id: file.id ?? "",
    name: file.name ?? "",
    mimeType: file.mimeType ?? undefined,
    modifiedTime: file.modifiedTime ?? undefined,
    path,
    size: file.size ? Number(file.size) : undefined,
    webViewLink: file.webViewLink ?? undefined,
  };
}
