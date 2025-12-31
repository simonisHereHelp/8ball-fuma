import type { TextRenderSpec } from "@/lib/adapter/content-adapter";

export function TextBody({ spec }: { spec: TextRenderSpec }) {
  return (
    <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">
      {spec.text}
    </pre>
  );
}
