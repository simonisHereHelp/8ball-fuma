import { Pinecone } from "@pinecone-database/pinecone";
import { NextResponse } from "next/server";
import { getSource } from "@/lib/source";

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
      upsert: (args: {
        namespace?: string;
        vectors: {
          id: string;
          values: number[];
          metadata?: Record<string, string>;
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
    const mockVectors = Array.isArray(requestBody?.vectors)
      ? requestBody.vectors
      : null;

    if (mockRecords || mockVectors) {
      const vectors = (mockVectors ?? mockRecords ?? [])
        .filter(
          (record: { id?: string; values?: number[] }) =>
            Boolean(record?.id) && Array.isArray(record?.values),
        )
        .map(
          (record: {
            id: string;
            values: number[];
            metadata?: Record<string, string>;
          }) => ({
            id: record.id,
            values: record.values,
            metadata: record.metadata,
          }),
        );
      if (vectors.length === 0) {
        return NextResponse.json(
          { error: "No valid mock vectors provided." },
          { status: 400 },
        );
      }

      console.info("[rag/prep] Upsert to Pinecone (mock mode)...", {
        vectors: vectors.length,
        index: pineconeIndex,
        namespace: pineconeNamespace,
      });

      await index.upsert({
        namespace: pineconeNamespace,
        vectors,
      });

      return NextResponse.json({
        status: "ok",
        upserted: vectors.length,
        message: "Upsert to Pinecone (mock mode)...",
      });
    }

    const docsSource = await getSource();
    const pages = docsSource.getPages();

    console.info("[rag/prep] Docs upsert skipped.", {
      pages: pages.length,
      index: pineconeIndex,
      namespace: pineconeNamespace,
    });

    return NextResponse.json(
      {
        error:
          "Docs upsert requires vector embeddings. Send vectors in mock mode or use a Pinecone SDK that supports records upsert for hosted embeddings.",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("[rag/prep] Failed to prepare embeddings.", error);
    return NextResponse.json(
      { error: "Failed to prepare embeddings." },
      { status: 500 },
    );
  }
}
