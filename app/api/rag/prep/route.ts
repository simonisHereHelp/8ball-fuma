import { NextResponse } from "next/server";
import { getSource } from "@/lib/source";
const BATCH_SIZE = 50;

const cleanHost = (host: string) => host.replace(/\/$/, "");

const toSlug = (url: string) => url.replace(/^\/docs\/pages\/?/, "");
const getFileType = (path: string) => {
  const match = path.split(".").pop();
  return match ? match.toLowerCase() : "unknown";
};

const buildPageText = ({
  title,
  description,
  url,
}: {
  title?: string;
  description?: string;
  url: string;
}) => {
  const segments = [title, description, url].filter(Boolean);
  return segments.join("\n\n");
};

const upsertBatch = async (
  host: string,
  apiKey: string,
  records: {
    id: string;
    text: string;
    metadata: Record<string, string>;
  }[],
) => {
  const response = await fetch(`${cleanHost(host)}/records/upsert`, {
    method: "POST",
    headers: {
      "Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      namespace: "docs",
      records,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    console.error("[rag/prep] Pinecone upsert failed.", {
      status: response.status,
      message,
    });
    throw new Error(`Pinecone upsert failed: ${message}`);
  }
};

export async function POST() {
  const pineconeKey = process.env.PINECONE_API_KEY;
  const pineconeHost = process.env.PINECONE_HOST;

  if (!pineconeKey || !pineconeHost) {
    console.error("[rag/prep] Missing environment variables.", {
      hasPineconeKey: Boolean(pineconeKey),
      hasPineconeHost: Boolean(pineconeHost),
    });
    return NextResponse.json(
      { error: "Missing Pinecone environment variables." },
      { status: 500 },
    );
  }

  try {
    const docsSource = await getSource();
    const pages = docsSource.getPages();

    let upserted = 0;
    const records: {
      id: string;
      text: string;
      metadata: Record<string, string>;
    }[] = [];

    console.info("[rag/prep] Upsert to Pinecone...", { pages: pages.length });

    for (const page of pages) {
      const content = await page.data.load();
      const text = buildPageText({
        title: content.title ?? page.data.title,
        description: content.description,
        url: page.url,
      });

      if (!text.trim()) {
        console.warn("[rag/prep] Skipping empty page payload.", {
          url: page.url,
        });
        continue;
      }

      records.push({
        id: page.url,
        text,
        metadata: {
          title: content.title ?? page.data.title,
          url: page.url,
          slug: toSlug(page.url),
          fileType: getFileType(page.file.path),
        },
      });

      if (records.length >= BATCH_SIZE) {
        await upsertBatch(pineconeHost, pineconeKey, records);
        upserted += records.length;
        const percent = Math.round((upserted / pages.length) * 100);
        console.info("[rag/prep] Upsert progress.", {
          message: `${percent}% upserts completed`,
          upserted,
        });
        records.length = 0;
      }
    }

    if (records.length > 0) {
      await upsertBatch(pineconeHost, pineconeKey, records);
      upserted += records.length;
    }

    console.info("[rag/prep] Upsert complete.", { upserted });

    return NextResponse.json({
      status: "ok",
      upserted,
      message: "Upsert to Pinecone...",
    });
  } catch (error) {
    console.error("[rag/prep] Failed to prepare embeddings.", error);
    return NextResponse.json(
      { error: "Failed to prepare embeddings." },
      { status: 500 },
    );
  }
}
