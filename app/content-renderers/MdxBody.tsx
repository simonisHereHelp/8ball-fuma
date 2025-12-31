import type { MDXComponents } from "mdx/types";
import type { MdxRenderSpec } from "@/lib/adapter/content-adapter";

export function MdxBody({ spec, components }: { spec: MdxRenderSpec; components?: MDXComponents }) {
  const Body = spec.body;
  return <Body components={components} />;
}
