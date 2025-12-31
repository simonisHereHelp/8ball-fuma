import { z } from "zod";

export const renderSpecSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("mdx"), toc: z.any(), body: z.any() }),
  z.object({ kind: z.literal("pdf"), pdfUrl: z.string(), downloadUrl: z.string().optional() }),
  z.object({ kind: z.literal("text"), text: z.string() }),
  z.object({ kind: z.literal("image"), images: z.array(z.object({ url: z.string(), alt: z.string().optional(), id: z.string() })) }),
  z.object({ kind: z.literal("json"), raw: z.string(), parsed: z.any().optional() }),
  z.object({ kind: z.literal("audio"), sources: z.array(z.object({ url: z.string(), type: z.string().optional() })) }),
  z.object({ kind: z.literal("video"), sources: z.array(z.object({ url: z.string(), type: z.string().optional() })) }),
  z.object({ kind: z.literal("smartBundle"), key: z.string() }),
  z.object({ kind: z.literal("fallback"), reason: z.string() }),
]);
