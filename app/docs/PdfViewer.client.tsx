"use client";

import dynamic from "next/dynamic";
import { useState, type FC } from "react";

interface PdfViewerProps {
  url: string;
}

// 1. The Internal Heavy Component (The one we actually split off)
const DynamicEngine = dynamic(() => Promise.resolve(PdfViewerImpl), {
  ssr: false,
  loading: () => (
    <div className="h-[800px] animate-pulse bg-fd-muted rounded-xl flex items-center justify-center">
      <p className="text-fd-muted-foreground text-sm font-medium">Loading Featured Viewer...</p>
    </div>
  ),
});

// 2. The Implementation
function PdfViewerImpl({ url }: PdfViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  return (
    <div className="flex flex-col w-full h-[800px] rounded-xl overflow-hidden border border-fd-border bg-fd-card">
       {/* UI code here as before... */}
       <iframe 
         src={`${url}#view=FitH`} 
         className="w-full h-full" 
         onLoad={() => setIsLoading(false)} 
       />
    </div>
  );
}

// 3. THE FIX: Export a standard FC
// This is a plain function, so it perfectly matches the FC type.
export const PdfViewer: FC<PdfViewerProps> = ({ url }) => {
  return <DynamicEngine url={url} />;
};