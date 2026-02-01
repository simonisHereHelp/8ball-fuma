import { Pinecone } from "@pinecone-database/pinecone";
import { NextResponse } from "next/server";
import { getSource } from "@/lib/source";
const BATCH_SIZE = 50;

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

export async function POST(request: Request) {
  const pineconeKey = process.env.PINECONE_API_KEY;
  const pineconeHost = process.env.PINECONE_HOST;
  const pineconeIndex = process.env.PINECONE_INDEX_NAME ?? "8ball-fuma";
  const pineconeNamespace = process.env.PINECONE_NAMESPACE ?? "docs";

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
    const pc = new Pinecone({ apiKey: pineconeKey });
    const index = pc.index(pineconeIndex, pineconeHost) as unknown as {
      upsertRecords: (args: {
        namespace?: string;
        records: {
          id: string;
          text: string;
          metadata: Record<string, string>;
        }[];
      }) => Promise<unknown>;
    };
    const requestBody =
      request.headers.get("content-type")?.includes("application/json") === true
        ? await request.json().catch(() => null)
        : null;
    const mockRecords = Array.isArray(requestBody?.records)
      ? requestBody.records
      : null;

    if (mockRecords) {
      const records = mockRecords.filter(
        (record: { id?: string; text?: string }) =>
          Boolean(record?.id) && Boolean(record?.text),
      );
      if (records.length === 0) {
        return NextResponse.json(
          { error: "No valid mock records provided." },
          { status: 400 },
        );
      }

      console.info("[rag/prep] Upsert to Pinecone (mock mode)...", {
        records: records.length,
        index: pineconeIndex,
        namespace: pineconeNamespace,
      });

      await index.upsertRecords({
        namespace: pineconeNamespace,
        records,
      });

      return NextResponse.json({
        status: "ok",
        upserted: records.length,
        message: "Upsert to Pinecone (mock mode)...",
      });
    }

    const docsSource = await getSource();
    const pages = docsSource.getPages();

    let upserted = 0;
    const records: {
      id: string;
      text: string;
      metadata: Record<string, string>;
    }[] = [];

    console.info("[rag/prep] Upsert to Pinecone...", {
      pages: pages.length,
      index: pineconeIndex,
      namespace: pineconeNamespace,
    });

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
        await index.upsertRecords({
          namespace: pineconeNamespace,
          records,
        });
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
      await index.upsertRecords({
        namespace: pineconeNamespace,
        records,
      });
      upserted += records.length;
    }

    console.info("[rag/prep] Upsert complete.", {
      upserted,
      index: pineconeIndex,
      namespace: pineconeNamespace,
    });

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
