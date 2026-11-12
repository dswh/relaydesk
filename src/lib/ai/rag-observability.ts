import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";

import type { Client } from "langsmith";
import { traceable } from "langsmith/traceable";
import type { RunTreeConfig } from "langsmith/run_trees";

export type RagSpan = {
  id: string;
  parentId: string;
  name: string;
  kind: "chain" | "retriever" | "llm" | "embedding";
  startedAt: string;
  endedAt: string;
  durationMs: number;
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  error?: string;
};

type TraceContext = {
  client?: Client;
  parentId: string;
  spans: RagSpan[];
};

const shared = globalThis as typeof globalThis & { relaydeskRagContext?: AsyncLocalStorage<TraceContext> };
const context = shared.relaydeskRagContext ??= new AsyncLocalStorage<TraceContext>();

export async function observeRagStage<T>(
  name: string,
  kind: RagSpan["kind"],
  inputs: Record<string, unknown>,
  operation: () => Promise<T>,
  summarize: (result: T) => Record<string, unknown>,
): Promise<T> {
  const active = context.getStore();
  if (!active) return operation();
  const id = randomUUID();
  const start = performance.now();
  const span: RagSpan = {
    id, parentId: active.parentId, name, kind, inputs,
    startedAt: new Date().toISOString(), endedAt: "", durationMs: 0,
  };
  active.spans.push(span);
  const execute = async () => {
    const result = await operation();
    span.outputs = summarize(result);
    return result;
  };
  const run = active.client
    ? traceable(execute, {
        id, name, run_type: kind === "embedding" ? "embedding" : kind,
        client: active.client, tracingEnabled: true,
        on_start: run => {
          const time = run?.toJSON().start_time;
          if (time !== undefined) span.startedAt = typeof time === "number" ? new Date(time).toISOString() : time;
        },
        processInputs: () => inputs,
        processOutputs: () => span.outputs ?? {},
      })
    : execute;
  try {
    const result = await context.run({ ...active, parentId: id }, run);
    return result;
  } catch (error) {
    span.error = error instanceof Error ? error.message : "Stage failed";
    throw error;
  } finally {
    span.endedAt = new Date().toISOString();
    span.durationMs = Math.round((performance.now() - start) * 100) / 100;
  }
}

export async function captureRagTrace<T>(
  inputs: Record<string, unknown>,
  operation: () => Promise<T>,
  options: {
    client?: Client;
    destination?: Pick<RunTreeConfig, "address" | "project_name">;
    metadata: Record<string, unknown>;
  },
) {
  const id = randomUUID();
  const spans: RagSpan[] = [];
  let startedAt = new Date().toISOString();
  const start = performance.now();
  const run = options.client
    ? traceable(operation, {
        id, name: "relaydesk.rag.answer", run_type: "chain", client: options.client,
        tracingEnabled: true, ...options.destination, metadata: options.metadata,
        on_start: tree => {
          const time = tree?.toJSON().start_time;
          if (time !== undefined) startedAt = typeof time === "number" ? new Date(time).toISOString() : time;
        },
        processInputs: () => inputs,
      })
    : operation;
  const output = await context.run({ client: options.client, parentId: id, spans }, run);
  return {
    id, startedAt, endedAt: new Date().toISOString(),
    durationMs: Math.round((performance.now() - start) * 100) / 100,
    spans, output,
  };
}
