import { compilePdf } from "../compilePdf";
import type {
  AdapterResult,
  DriveLocator,
  ContentAdapter,
} from "./content-adapter";

export const pdfAdapter: ContentAdapter<DriveLocator> = {
  kind: "pdf",
  match(target) {
    return "name" in target && target.name.toLowerCase().endsWith(".pdf");
  },
  async load(locator, context): Promise<AdapterResult> {
    const previewUrl = await context.client.getPreviewUrl(locator.id, locator.mimeType);
    const compiled = await compilePdf(locator.path.join("/"), {
      url: previewUrl,
      title: locator.name,
      description: locator.webViewLink,
    });

    return {
      kind: "pdf",
      meta: {
        title: compiled.title ?? locator.name,
        description: compiled.description,
        modifiedTime: locator.modifiedTime,
      },
      cachePolicy: { revalidate: context.defaults?.revalidate ?? 60 },
      renderSpec: {
        kind: "pdf",
        pdfUrl: previewUrl,
        downloadUrl: context.client.getExportUrl?.(locator.id),
      },
    };
  },
};
