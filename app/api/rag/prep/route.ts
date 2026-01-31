import { NextResponse } from "next/server";
import { getSource } from "@/lib/source";
import type { TableOfContents } from "fumadocs-core/server";

const EMBEDDING_MODEL = "text-embedding-3-small";
const BATCH_SIZE = 32;

const cleanHost = (host: string) => host.replace(/\/$/, "");

const flattenToc = (toc: TableOfContents) => {
  const lines: string[] = [];
  const walk = (items?: TableOfContents) => {
    if (!items) return;
    for (const item of items) {
      if (typeof item.title === "string") {
        lines.push(item.title);
      }
      walk(item.children);
    }
  };
  walk(toc);
  return lines.join("\n");
};

const toSlug = (url: string) => url.replace(/^\/docs\/pages\/?/, "");

const buildPageText = ({
  title,
  description,
  toc,
}: {
  title?: string;
  description?: string;
  toc: TableOfContents;
}) => {
  const segments = [title, description, flattenToc(toc)].filter(Boolean);
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
    throw new Error(`Pinecone upsert failed: ${message}`);
  }
};

export async function POST() {
  const pineconeKey = process.env.PINECONE_API_KEY;
  const pineconeHost = process.env.PINECONE_HOST;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!pineconeKey || !pineconeHost || !openaiKey) {
    return NextResponse.json(
      { error: "Missing Pinecone or OpenAI environment variables." },
      { status: 500 },
    );
  }

  const docsSource = await getSource();
  const pages = docsSource.getPages();

  let upserted = 0;
  const inputs: string[] = [];
  const metadata: { id: string; metadata: Record<string, string> }[] = [];

  for (const page of pages) {
    const content = await page.data.load();
    const text = buildPageText({
      title: content.title ?? page.data.title,
      description: content.description,
      toc: content.toc,
    });

    if (!text.trim()) continue;

    inputs.push(text);
    metadata.push({
      id: page.url,
      metadata: {
        title: content.title ?? page.data.title,
        url: page.url,
        slug: toSlug(page.url),
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

  return NextResponse.json({
    status: "ok",
    upserted,
  });
}
