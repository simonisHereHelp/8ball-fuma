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
            },
            {
              title: "我的房產",
              icon: (
                <span className="border border-fd-primary/50 bg-gradient-to-t from-fd-primary/30 rounded-lg p-1 text-fd-primary">
                  <RocketIcon />
                </span>
              ),
              url: "/docs/HouseMaint",
            },
            {
              title: "水電",
              icon: (
                <span className="border border-fd-foreground/50 bg-gradient-to-t from-fd-foreground/30 rounded-lg p-1 text-fd-foreground">
                  <RocketIcon />
                </span>
              ),
              url: "/docs/HouseUtilities",
            },
            {
              title: "台灣路用",
              icon: (
                <span className="border border-fd-foreground/50 bg-gradient-to-t from-fd-foreground/30 rounded-lg p-1 text-fd-foreground">
                  <RocketIcon />
                </span>
              ),
              url: "/docs/TaiwanPersonalDocs",
            },
          ],
        }}
      >
        {children}
      </DocsLayout>
    </Body>
  );
}
