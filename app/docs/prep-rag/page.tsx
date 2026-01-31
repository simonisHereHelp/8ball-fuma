"use client";

import { useEffect, useMemo, useState } from "react";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";

export const dynamic = "force-dynamic";

type StepKey = "corpus" | "normalize" | "embed";

type StepState = {
  label: string;
  progress: number;
  status: "pending" | "running" | "complete";
};

const createSteps = (): Record<StepKey, StepState> => ({
  corpus: {
    label: "Corpus assembly",
    progress: 0,
    status: "running",
  },
  normalize: {
    label: "Document normalization and chunking",
    progress: 0,
    status: "pending",
  },
  embed: {
    label: "Embedding generation",
    progress: 0,
    status: "pending",
  },
});

export default function PrepRagPage() {
  const [steps, setSteps] = useState<Record<StepKey, StepState>>(createSteps);

  useEffect(() => {
    const order: StepKey[] = ["corpus", "normalize", "embed"];
    let currentIndex = 0;

    const interval = setInterval(() => {
      const currentKey = order[currentIndex];
      setSteps((prev) => {
        const current = prev[currentKey];
        if (!current || current.status !== "running") {
          return prev;
        }
        const nextProgress = Math.min(current.progress + 20, 100);
        const nextState: Record<StepKey, StepState> = {
          ...prev,
          [currentKey]: {
            ...current,
            progress: nextProgress,
            status: nextProgress >= 100 ? "complete" : "running",
          },
        };

        if (nextProgress >= 100 && currentIndex < order.length - 1) {
          const nextKey = order[currentIndex + 1];
          nextState[nextKey] = {
            ...nextState[nextKey],
            status: "running",
          };
          currentIndex += 1;
        }

        return nextState;
      });
    }, 700);

    return () => clearInterval(interval);
  }, []);

  const activityLog = useMemo(() => {
    return (Object.entries(steps) as [StepKey, StepState][])
      .map(([, step]) => {
        if (step.status === "complete") {
          return [
            `${step.label} complete.`,
            `${step.label} progress: 100%.`,
          ];
        }
        if (step.status === "running") {
          return [
            `${step.label} now....`,
            `${step.label} progress: ${step.progress}%.`,
          ];
        }
        return [`${step.label} queued.`, `${step.label} progress: 0%.`];
      })
      .flat();
  }, [steps]);

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
        <div className="mt-4 rounded-2xl border border-fd-border bg-fd-muted/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-fd-muted-foreground">
            Activities log
          </p>
          <ul className="mt-3 space-y-2 text-sm text-fd-muted-foreground">
            {activityLog.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </div>
      </DocsBody>
    </DocsPage>
  );
}
