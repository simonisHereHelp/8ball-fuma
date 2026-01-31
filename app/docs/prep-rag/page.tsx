import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";

export const dynamic = "force-dynamic";

export default function PrepRagPage() {
  return (
    <DocsPage toc={[]} full>
      <DocsTitle>Prep RAG</DocsTitle>
      <DocsDescription>
        Preparing RAG source for the documentation assistant.
      </DocsDescription>
      <DocsBody>
        <p className="text-sm text-fd-muted-foreground">
          Preparing RAG source...
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-fd-muted-foreground">
          <li>Corpus assembly</li>
          <li>Document normalization and chunking</li>
          <li>Embedding generation</li>
        </ul>
      </DocsBody>
    </DocsPage>
  );
}
