"use client";

import { useEffect, useState } from "react";

interface PdfViewerProps {
  url: string;
}

export default function PdfViewer({ url }: PdfViewerProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="flex flex-col w-full h-[800px] rounded-xl overflow-hidden border border-fd-border bg-fd-card">
      {/* Featured Toolbar Shell */}
      <div className="flex items-center justify-between p-2 border-b bg-fd-muted text-xs">
        <div className="flex gap-4 px-2">
          <span>Featured PDF Viewer</span>
        </div>
        <a 
          href={url} 
          target="_blank" 
          className="px-3 py-1 rounded bg-fd-primary text-fd-primary-foreground hover:opacity-90"
        >
          Download PDF
        </a>
      </div>

      <div className="relative flex-1 bg-fd-background">
        {/* The Shell Container for PDF.js or Iframe Fallback */}
        <iframe
          src={`${url}#view=FitH`}
          className="w-full h-full"
          onLoad={() => setIsLoading(false)}
        />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-fd-card">
            <p className="animate-pulse text-sm text-fd-muted-foreground">Initializing Engine...</p>
          </div>
        )}
      </div>
    </div>
  );
}