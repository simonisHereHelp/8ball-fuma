"use client";

import Link from "next/link";
import { useMemo } from "react";

interface PdfViewerProps {
  src: string;
  title?: string;
}

export function PdfViewer({ src, title }: PdfViewerProps) {
  const iframeTitle = useMemo(
    () => title || "PDF document",
    [title],
  );

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-fd-border bg-white/60 shadow-sm">
        <iframe
          src={src}
          title={iframeTitle}
          className="h-[80vh] w-full"
          loading="lazy"
          allow="fullscreen"
        />
      </div>
      <p className="text-sm text-fd-muted-foreground">
        Having trouble viewing this PDF? You can <Link className="underline" href={src}>download it</Link> instead.
      </p>
    </div>
  );
}