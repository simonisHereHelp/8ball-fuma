import { Pinecone } from "@pinecone-database/pinecone";
import { NextResponse } from "next/server";

export async function POST() {
  const pineconeKey = process.env.PINECONE_API_KEY;
  const pineconeHost = process.env.PINECONE_HOST;
  const pineconeIndex = process.env.PINECONE_INDEX ?? "8ball-fuma";
  const pineconeNamespace = process.env.PINECONE_NAMESPACE ?? "__default__";

  if (!pineconeKey || !pineconeHost || !pineconeIndex) {
    console.error("[rag/prep] Missing environment variables.", {
      hasPineconeKey: Boolean(pineconeKey),
      hasPineconeHost: Boolean(pineconeHost),
      hasPineconeIndex: Boolean(pineconeIndex),
    });
    return NextResponse.json(
      { error: "Missing Pinecone environment variables." },
      { status: 500 },
    );
  }

  try {
    const pc = new Pinecone({ apiKey: pineconeKey });
    const namespace = pc.index(pineconeIndex, pineconeHost).namespace(
      pineconeNamespace,
    ) as unknown as {
      upsertRecords: (
        records: {
          _id: string;
          chunk_text: string;
          category?: string;
          quarter?: string;
        }[],
      ) => Promise<unknown>;
    };
    const records = [
      {
        _id: "vec1",
        chunk_text:
          "AAPL reported a year-over-year revenue increase, expecting stronger Q3 demand for its flagship phones.",
        category: "technology",
        quarter: "Q3",
      },
      {
        _id: "vec2",
        chunk_text:
          "Analysts suggest that AAPL's upcoming Q4 product launch event might solidify its position in the premium smartphone market.",
        category: "technology",
        quarter: "Q4",
      },
      {
        _id: "vec3",
        chunk_text:
          "AAPL's strategic Q3 partnerships with semiconductor suppliers could mitigate component risks and stabilize iPhone production.",
        category: "technology",
        quarter: "Q3",
      },
      {
        _id: "vec4",
        chunk_text:
          "AAPL may consider healthcare integrations in Q4 to compete with tech rivals entering the consumer wellness space.",
        category: "technology",
        quarter: "Q4",
      },
    ];

    console.info("[rag/prep] Upsert to Pinecone (template records)...", {
      records: records.length,
      index: pineconeIndex,
      namespace: pineconeNamespace,
    });

    await namespace.upsertRecords(records);

    return NextResponse.json({
      status: "ok",
      upserted: records.length,
      message: "Upsert to Pinecone (template records)...",
    });
  } catch (error) {
    console.error("[rag/prep] Failed to prepare embeddings.", error);
    return NextResponse.json(
      { error: "Failed to prepare embeddings." },
      { status: 500 },
    );
  }
}
