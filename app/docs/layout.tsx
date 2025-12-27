import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import type { ReactNode } from "react";
import { baseOptions } from "@/app/layout.config";
import { source } from "@/lib/source";
import { Body } from "./layout.client";
import { BoxIcon, RocketIcon } from "lucide-react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Body>
      <DocsLayout
        tree={source.pageTree}
        {...baseOptions}
        sidebar={{
          prefetch: false,
          tabs: [
            {
              title: "我的退休金",
              description: "Features available in /app",
              icon: (
                <span className="border border-blue-600/50 bg-gradient-to-t from-blue-600/30 rounded-lg p-1 text-blue-600">
                  <BoxIcon />
                </span>
              ),
              url: "/docs/InvestAndIRA",
            },
            {
              title: "我的健康保險",
              description: "Features available in /pages",
              icon: (
                <span className="border purple-blue-600/50 bg-gradient-to-t from-purple-600/30 rounded-lg p-1 text-purple-600">
                  <BoxIcon />
                </span>
              ),
              url: "/docs/HealthAndDental",
            }
          ],
        }}
      >
        {children}
      </DocsLayout>
    </Body>
  );
}
