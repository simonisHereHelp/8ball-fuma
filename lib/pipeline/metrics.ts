export interface MetricEvent {
  name: string;
  value?: number;
  tags?: Record<string, string | number | boolean>;
}

const listeners = new Set<(event: MetricEvent) => void>();

export function emitMetric(event: MetricEvent) {
  for (const listener of listeners) {
    listener(event);
  }
}

export function onMetric(listener: (event: MetricEvent) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
