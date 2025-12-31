/* eslint-disable no-console */
export interface PipelineLogContext {
  slug?: string[];
  adapter?: string;
  stage?: "catalog" | "bundle" | "adapter" | "render";
}

export function logInfo(message: string, context: PipelineLogContext = {}) {
  console.info(`[pipeline] ${message}`, context);
}

export function logError(message: string, error: unknown, context: PipelineLogContext = {}) {
  console.error(`[pipeline] ${message}`, { error, ...context });
}
