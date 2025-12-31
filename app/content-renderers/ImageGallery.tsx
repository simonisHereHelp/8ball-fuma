import Image from "next/image";
import type { ImageRenderSpec } from "@/lib/adapter/content-adapter";

export function ImageGallery({ spec }: { spec: ImageRenderSpec }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {spec.images.map((image) => (
        <figure key={image.id} className="rounded-md border bg-muted/40 p-2">
          <Image
            src={image.url}
            alt={image.alt ?? image.id}
            width={800}
            height={600}
            className="h-auto w-full object-contain"
          />
          <figcaption className="mt-2 text-sm text-muted-foreground">{image.alt ?? image.id}</figcaption>
        </figure>
      ))}
    </div>
  );
}
