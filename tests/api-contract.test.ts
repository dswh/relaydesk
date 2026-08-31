import { readFile } from "node:fs/promises";

import Ajv, { type AnySchema } from "ajv";
import { describe, expect, it } from "vitest";

import apiContract from "../openapi/relaydesk.openapi.json";
import { listUrgentTickets } from "../examples/list-tickets";
import { GET as getHealth } from "../src/app/api/health/route";
import { GET as getTicket } from "../src/app/api/tickets/[id]/route";
import { GET as listTickets } from "../src/app/api/tickets/route";
import { endpoints } from "../src/app/developers/api/page";

type SchemaRecord = Record<string, unknown>;

const schemas = apiContract.components.schemas as unknown as Record<string, SchemaRecord>;
const ajv = new Ajv({ allErrors: true, strict: false });

function dereference(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(dereference);
  if (!value || typeof value !== "object") return value;

  const record = value as SchemaRecord;
  if (typeof record.$ref === "string") {
    const name = record.$ref.split("/").at(-1);
    if (!name || !schemas[name]) throw new Error(`Unknown schema reference ${record.$ref}`);
    return dereference(schemas[name]);
  }

  return Object.fromEntries(
    Object.entries(record).map(([key, entry]) => [key, dereference(entry)]),
  );
}

function responseSchema(path: keyof typeof apiContract.paths, status: "200" | "404") {
  const operation = apiContract.paths[path].get;
  const response = operation.responses[status as keyof typeof operation.responses];
  if (!response || !("content" in response)) throw new Error(`Missing ${status} schema for ${path}`);
  return response.content["application/json"].schema;
}

function expectValid(schema: unknown, payload: unknown) {
  const validate = ajv.compile(dereference(schema) as AnySchema);
  expect(validate(payload), JSON.stringify(validate.errors, null, 2)).toBe(true);
}

describe("OpenAPI contract", () => {
  it("matches the health response", async () => {
    const response = getHealth();
    expectValid(responseSchema("/api/health", "200"), await response.json());
  });

  it("strictly matches the list response", async () => {
    const response = await listTickets(
      new Request("http://localhost:3000/api/tickets?filter=urgent"),
    );
    const payload = await response.json();
    expectValid(responseSchema("/api/tickets", "200"), payload);
    expect(response.headers.get("Server-Timing")).toMatch(/^repository;dur=/);
    expect(response.headers.get("X-RelayDesk-Data-Source")).toBeTruthy();
  });

  it("strictly matches success and error detail responses", async () => {
    const found = await getTicket(new Request("http://localhost"), {
      params: Promise.resolve({ id: "RD-1842" }),
    });
    expectValid(responseSchema("/api/tickets/{id}", "200"), await found.json());

    const missing = await getTicket(new Request("http://localhost"), {
      params: Promise.resolve({ id: "RD-999999" }),
    });
    expect(missing.status).toBe(404);
    expectValid(responseSchema("/api/tickets/{id}", "404"), await missing.json());
  });

  it("keeps the TypeScript example executable", async () => {
    const response = await listTickets(
      new Request("http://localhost:3000/api/tickets?filter=urgent"),
    );
    const payload = await listUrgentTickets(async () => response);
    expect(payload.meta.filter).toBe("urgent");
    expect(payload.data.every((ticket) => ticket.priority === "urgent")).toBe(true);
  });

  it("publishes every operation in the reference page", async () => {
    const reference = await readFile(
      new URL("../src/app/developers/api/page.tsx", import.meta.url),
      "utf8",
    );
    for (const [path, pathItem] of Object.entries(apiContract.paths)) {
      expect(reference).toContain(path);
      expect(endpoints).toContainEqual(
        expect.objectContaining({ operationId: pathItem.get.operationId, path }),
      );
    }
  });
});
