import type { JsonRenderSpec } from "@/lib/adapter/content-adapter";

export function JsonViewer({ spec }: { spec: JsonRenderSpec }) {
  const pretty = spec.parsed ? JSON.stringify(spec.parsed, null, 2) : spec.raw;
  return (
    <pre className="whitespace-pre rounded-md bg-muted p-4 text-sm overflow-auto">
      {pretty}
    </pre>
  );
}
