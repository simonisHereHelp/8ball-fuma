import { NextResponse } from "next/server";
import { getSource } from "@/lib/source";
const EMBEDDING_MODEL = "text-embedding-3-small";
const BATCH_SIZE = 32;

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

const embedBatch = async (apiKey: string, input: string[]) => {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    console.error("[rag/prep] OpenAI embeddings failed.", {
      status: response.status,
      message,
    });
    throw new Error(`OpenAI embeddings failed: ${message}`);
  }

  const data = (await response.json()) as {
    data: { embedding: number[] }[];
  };

  return data.data.map((item) => item.embedding);
};

const upsertBatch = async (
  host: string,
  apiKey: string,
  vectors: {
    id: string;
    values: number[];
    metadata: Record<string, string>;
  }[],
) => {
  const response = await fetch(`${cleanHost(host)}/vectors/upsert`, {
    method: "POST",
    headers: {
      "Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      vectors,
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
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!pineconeKey || !pineconeHost || !openaiKey) {
    console.error("[rag/prep] Missing environment variables.", {
      hasPineconeKey: Boolean(pineconeKey),
      hasPineconeHost: Boolean(pineconeHost),
      hasOpenAiKey: Boolean(openaiKey),
    });
    return NextResponse.json(
      { error: "Missing Pinecone or OpenAI environment variables." },
      { status: 500 },
    );
  }

  try {
    const docsSource = await getSource();
    const pages = docsSource.getPages();

    let upserted = 0;
    const inputs: string[] = [];
    const metadata: { id: string; metadata: Record<string, string> }[] = [];

    console.info("[rag/prep] Preparing embeddings.", { pages: pages.length });

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

      inputs.push(text);
      metadata.push({
        id: page.url,
        metadata: {
          title: content.title ?? page.data.title,
          url: page.url,
          slug: toSlug(page.url),
          fileType: getFileType(page.file.path),
        },
      });

      if (inputs.length >= BATCH_SIZE) {
        const embeddings = await embedBatch(openaiKey, inputs);
        const vectors = embeddings.map((values, index) => ({
          id: metadata[index].id,
          values,
          metadata: metadata[index].metadata,
        }));
        await upsertBatch(pineconeHost, pineconeKey, vectors);
        upserted += vectors.length;
        inputs.length = 0;
        metadata.length = 0;
      }
    }

    if (inputs.length > 0) {
      const embeddings = await embedBatch(openaiKey, inputs);
      const vectors = embeddings.map((values, index) => ({
        id: metadata[index].id,
        values,
        metadata: metadata[index].metadata,
      }));
      await upsertBatch(pineconeHost, pineconeKey, vectors);
      upserted += vectors.length;
    }

    console.info("[rag/prep] Upsert complete.", { upserted });

    return NextResponse.json({
      status: "ok",
      upserted,
    });
  } catch (error) {
    console.error("[rag/prep] Failed to prepare embeddings.", error);
    return NextResponse.json(
      { error: "Failed to prepare embeddings." },
      { status: 500 },
    );
  }
}
