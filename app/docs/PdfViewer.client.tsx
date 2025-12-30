"use client";

import dynamic from "next/dynamic";
import { useState, type FC } from "react";

interface PdfViewerProps {
  url: string;
}

/**
 * 1. THE DYNAMIC ENGINE
 * Ensures the Google Drive iframe logic only initializes in the browser.
 */
const DynamicEngine = dynamic(() => Promise.resolve(PdfViewerImpl), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col w-full h-[800px] rounded-xl border border-fd-border bg-fd-muted/50 animate-pulse items-center justify-center">
      <p className="text-fd-muted-foreground text-sm font-medium">Initializing PDF Engine...</p>
    </div>
  ),
});

/**
 * 2. THE IMPLEMENTATION (Internal)
 * Derived from your specific syntax requirements.
 */
function PdfViewerImpl({ url }: PdfViewerProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Workflow 1: The Iframe Source (Internal transformation to break the buffering loop)
  // Converts standard Drive API or View links to the /preview endpoint.
  const previewUrl = url.includes("/preview") 
    ? url 
    : url.replace(/\/view.*$/, "/preview").replace(/alt=media&key=.*$/, "preview");

  return (
    <div className="flex flex-col w-full h-[800px] rounded-xl overflow-hidden border border-fd-border bg-fd-card shadow-sm">
      {/* Featured Toolbar UI */}
      <div className="flex items-center justify-between p-3 border-b bg-fd-muted/50 text-xs transition-colors">
        <div className="flex items-center gap-3 px-2">
          <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-green-500'}`} />
          <span className="font-medium text-fd-muted-foreground">
            {isLoading ? "Connecting to Google Drive..." : "Document Preview Mode"}
          </span>
        </div>
        <div className="flex gap-2">
           <a 
            href={url} // Workflow 2: Uses the original link for the "Open in Drive" / Download action.
            target="_blank" 
            rel="noreferrer"
            className="px-4 py-1.5 rounded-lg bg-fd-primary text-fd-primary-foreground text-[11px] font-semibold hover:opacity-90 transition-opacity"
          >
            Download PDF
          </a>
        </div>
      </div>

      <div className="relative flex-1 bg-fd-background">
        <iframe
          src={previewUrl} 
          className={`w-full h-full transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setIsLoading(false)} // Now triggers correctly via /preview endpoint.
          allow="autoplay"
        />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-fd-card/50 backdrop-blur-sm">
             <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-fd-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] uppercase tracking-widest text-fd-muted-foreground">Buffering</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 3. THE EXPORTED COMPONENT (FC)
 * This matches the FC type perfectly for pdf-bodies.tsx.
 */
export const PdfViewer: FC<PdfViewerProps> = ({ url }) => {
  return <DynamicEngine url={url} />;
};

export default PdfViewer;