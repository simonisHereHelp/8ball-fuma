import { JsonViewer } from "./JsonViewer";
import { TextBody } from "./TextBody";
import { ImageGallery } from "./ImageGallery";
import { MediaPlayer } from "./MediaPlayer";
import type { SmartBundleRenderSpec } from "@/lib/adapter/content-adapter";

export function SmartBundleView({ spec }: { spec: SmartBundleRenderSpec }) {
  return (
    <div className="space-y-6">
      {spec.primaryData?.kind === "json" && <JsonViewer spec={spec.primaryData} />}
      {spec.primaryData?.kind === "text" && <TextBody spec={spec.primaryData} />}
      {spec.gallery && <ImageGallery spec={spec.gallery} />}
      {spec.media && <MediaPlayer spec={spec.media} />}
      {spec.attachments?.map((attachment, index) => (
        <TextBody key={`${spec.key}-attachment-${index}`} spec={attachment} />
      ))}
    </div>
  );
}
