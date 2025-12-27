// app/gallery/page.tsx
import { auth } from "@/auth";

const DRIVE_FOLDER_ID =
  process.env.DRIVE_FOLDER_ID;

type DriveImage = {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
};

async function fetchDriveImages(accessToken: string): Promise<DriveImage[]> {
  if (!DRIVE_FOLDER_ID) {
    throw new Error("Missing Drive folder id");
  }

  const query = `'${DRIVE_FOLDER_ID}' in parents and trashed = false and mimeType contains 'image/'`;
  const listUrl = new URL("https://www.googleapis.com/drive/v3/files");
  listUrl.searchParams.set("q", query);
  listUrl.searchParams.set("fields", "files(id,name,mimeType)");
  listUrl.searchParams.set("supportsAllDrives", "true");

  const listResponse = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!listResponse.ok) {
    throw new Error(`Failed to list Drive files: ${await listResponse.text()}`);
  }

  const { files } = (await listResponse.json()) as {
    files?: { id: string; name: string; mimeType: string }[];
  };

  if (!files || files.length === 0) return [];

  const downloads = await Promise.all(
    files.map(async (file) => {
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&supportsAllDrives=true`;
      const downloadResponse = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });

      if (!downloadResponse.ok) {
        throw new Error(`Failed to fetch ${file.name}`);
      }

      const buffer = Buffer.from(await downloadResponse.arrayBuffer());
      const base64 = buffer.toString("base64");

      return {
        ...file,
        dataUrl: `data:${file.mimeType};base64,${base64}`,
      } satisfies DriveImage;
    }),
  );

  return downloads;
}

export default async function GalleryPage() {
  const session = await auth();
  const accessToken = (session as any)?.accessToken as string;
  const images = await fetchDriveImages(accessToken);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 py-12">
      <section className="space-y-3 text-center">
        <h1 className="text-2xl font-semibold">Gallery</h1>
        <p className="text-fd-muted-foreground">
          Images are fetched directly from your configured Drive folder using the session access token and alt=media requests.
        </p>
      </section>

      <section className="space-y-4">
        {images.length === 0 ? (
          <p className="rounded-lg border border-fd-border bg-white/40 p-4 text-sm text-fd-muted-foreground">
            No images found in the configured Drive folder.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <figure key={image.id} className="overflow-hidden rounded-lg border border-fd-border bg-white/60 shadow-sm">
                <img src={image.dataUrl} alt={image.name} className="h-60 w-full object-contain bg-white" />
                <figcaption className="border-t border-fd-border p-3 text-sm">
                  <p className="font-medium text-fd-foreground">{image.name}</p>
                  <p className="text-xs text-fd-muted-foreground">{image.mimeType}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}