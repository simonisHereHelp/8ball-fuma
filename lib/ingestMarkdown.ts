import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

export type RecordForUpsert = {
  id: string;
  chunk_text: string;
  category: string;
  source_file: string;
  doc_type: "md" | "mdx";
  element_type: "markdown_text" | "markdown_image_ref";
  chunk_index: number;
  image_alt?: string;
};

function sha1Ascii(input: string) {
  return crypto.createHash("sha1").update(input, "utf8").digest("hex");
}

function chunkText(text: string, chunkSize = 1200, overlap = 200): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    const end = Math.min(start + chunkSize, cleaned.length);
    chunks.push(cleaned.slice(start, end));
    if (end === cleaned.length) break;
    start = Math.max(0, end - overlap);
  }
  return chunks;
}

function extractImages(markdown: string) {
  const re = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const out: Array<{ alt: string; startIdx: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    out.push({
      alt: (m[1] || "").trim(),
      startIdx: m.index,
    });
  }
  return out;
}

function contextWindow(text: string, centerIdx: number, windowChars = 500) {
  const start = Math.max(0, centerIdx - windowChars);
  const end = Math.min(text.length, centerIdx + windowChars);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

export async function buildRecordsFromFilesFolder(
  filesDirAbs: string,
): Promise<RecordForUpsert[]> {
  const entries = await fs.readdir(filesDirAbs, { withFileTypes: true });

  const mdFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter(
      (name) =>
        name.toLowerCase().endsWith(".md") ||
        name.toLowerCase().endsWith(".mdx"),
    );

  const records: RecordForUpsert[] = [];

  for (const fileName of mdFiles) {
    const fullPath = path.join(filesDirAbs, fileName);
    const raw = await fs.readFile(fullPath, "utf8");

    const parsed = matter(raw);
    const body = parsed.content ?? "";
    const title = typeof parsed.data?.title === "string" ? parsed.data.title : "";
    const category = title || "unknown";

    const docType: "md" | "mdx" = fileName.toLowerCase().endsWith(".mdx")
      ? "mdx"
      : "md";

    const docId = `md:${sha1Ascii(fileName)}`;

    const textChunks = chunkText(body, 1200, 200);
    textChunks.forEach((chunk, idx) => {
      const chunkIndex = idx + 1;
      const chunkTextWithHeader =
        `FILE: ${fileName}\n` +
        `CATEGORY: ${category}\n` +
        `CONTENT:\n` +
        chunk;

      records.push({
        id: `${docId}#text#c${String(chunkIndex).padStart(4, "0")}`,
        chunk_text: chunkTextWithHeader,
        category,
        source_file: fileName,
        doc_type: docType,
        element_type: "markdown_text",
        chunk_index: chunkIndex,
      });
    });

    const imageRefs = extractImages(body);
    imageRefs.forEach((ref, i) => {
      const ctx = contextWindow(body, ref.startIdx, 500);

      const imageChunk =
        `FILE: ${fileName}\n` +
        `CATEGORY: ${category}\n` +
        `MD IMAGE:\n` +
        `alt_text: ${ref.alt}\n` +
        `nearby_context: ${ctx}`;

      const imgChunks = chunkText(imageChunk, 1200, 150);
      imgChunks.forEach((chunk, chunkIdx) => {
        const chunkIndex = chunkIdx + 1;
        records.push({
          id: `${docId}#img${String(i + 1).padStart(4, "0")}#c${String(
            chunkIndex,
          ).padStart(3, "0")}`,
          chunk_text: chunk,
          category,
          source_file: fileName,
          doc_type: docType,
          element_type: "markdown_image_ref",
          chunk_index: chunkIndex,
          image_alt: ref.alt,
        });
      });
    });
  }

  return records;
}
