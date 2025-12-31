import type { MediaRenderSpec } from "@/lib/adapter/content-adapter";

export function MediaPlayer({ spec }: { spec: MediaRenderSpec }) {
  const isAudio = spec.kind === "audio";
  const sources = spec.sources;
  const Tag = isAudio ? "audio" : "video";

  return (
    <Tag controls className="w-full" poster={spec.posterUrl ?? undefined}>
      {sources.map((source) => (
        <source key={source.url} src={source.url} type={source.type} />
      ))}
      Your browser does not support the media element.
    </Tag>
  );
}
