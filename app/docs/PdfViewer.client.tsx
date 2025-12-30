"use client";

import dynamic from "next/dynamic";
import { useState, type FC } from "react";

interface PdfViewerProps {
  url: string;
}

/**
 * 1. THE DYNAMIC ENGINE
 * We wrap the actual implementation in next/dynamic with ssr: false.
 * This ensures the Google Drive iframe logic only initializes in the browser.
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
 * This mimics the logic from your tester.html using React state and Tailwind.
 */
function PdfViewerImpl({ url }: PdfViewerProps) {
  const [isLoading, setIsLoading] = useState(true);

  // We no longer need complex regex because google-drive.ts provides the correct link
  return (
    <div className="flex flex-col w-full h-[800px] ...">
      {/* ... Toolbar UI ... */}
      <div className="relative flex-1 bg-fd-background">
        <iframe
          src={url} // This is now a drive.google.com/file/d/.../preview link
          className={`w-full h-full ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setIsLoading(false)}
          allow="autoplay"
        />
        {/* Buffering Spinner will now hide once the /preview page loads */}
      </div>
    </div>
  );
}

/**
 * 3. THE EXPORTED COMPONENT (FC)
 * This is the "Safe" version imported by pdf-bodies.tsx. 
 * It matches the FC type perfectly and resolves all TypeScript conflicts.
 */
export const PdfViewer: FC<PdfViewerProps> = ({ url }) => {
  return <DynamicEngine url={url} />;
};

export default PdfViewer;