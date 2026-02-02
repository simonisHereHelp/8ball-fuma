import path from "path";
import { Pinecone } from "@pinecone-database/pinecone";
import { NextResponse } from "next/server";
import { buildRecordsFromFilesFolder } from "@/lib/ingestMarkdown";

export const runtime = "nodejs";

export async function POST() {
  try {
    const pineconeKey = process.env.PINECONE_API_KEY;
    const pineconeHost = process.env.PINECONE_INDEX_HOST;
    const pineconeIndex = process.env.PINECONE_INDEX ?? "8ball-fuma";
    const pineconeNamespace = process.env.PINECONE_NAMESPACE ?? "__default__";

    if (!pineconeKey || !pineconeHost || !pineconeIndex) {
      console.error("[rag/prep] Missing environment variables.", {
        hasPineconeKey: Boolean(pineconeKey),
        hasPineconeHost: Boolean(pineconeHost),
        hasPineconeIndex: Boolean(pineconeIndex),
      });
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing env vars (PINECONE_API_KEY, PINECONE_INDEX, PINECONE_INDEX_HOST)",
        },
        { status: 500 },
      );
    }

    const filesDirAbs = path.join(process.cwd(), "files");
    const records = await buildRecordsFromFilesFolder(filesDirAbs);

    if (records.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No .md/.mdx files found in ./files" },
        { status: 400 },
      );
    }

    const pc = new Pinecone({ apiKey: pineconeKey });
    const namespace = pc.index(pineconeIndex, pineconeHost).namespace(
      pineconeNamespace,
    );

    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      await namespace.upsertRecords({
        records: batch.map((record) => ({
          id: record.id,
          chunk_text: record.chunk_text,
          category: record.category,
          source_file: record.source_file,
          doc_type: record.doc_type,
          element_type: record.element_type,
          chunk_index: record.chunk_index,
          image_path: record.image_path,
          image_alt: record.image_alt,
          image_index: record.image_index,
        })),
      });
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Upserted records from ./files",
        namespace: pineconeNamespace,
        totalRecords: records.length,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[rag/prep] Failed to prepare embeddings.", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
