import { ArrowLeft, ArrowRight, Braces, CheckCircle2, Copy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import apiContract from "../../../../openapi/relaydesk.openapi.json";

export const metadata: Metadata = {
  alternates: { canonical: "/developers/api" },
  description:
    "Build with the RelayDesk ticket and service APIs using the verified OpenAPI contract and TypeScript examples.",
  title: "API reference",
};

export const endpoints = [
  {
    description: apiContract.paths["/api/health"].get.responses["200"].description,
    method: "GET",
    operationId: apiContract.paths["/api/health"].get.operationId,
    path: "/api/health",
    summary: apiContract.paths["/api/health"].get.summary,
  },
  {
    description: apiContract.paths["/api/tickets"].get.description,
    method: "GET",
    operationId: apiContract.paths["/api/tickets"].get.operationId,
    path: "/api/tickets",
    summary: apiContract.paths["/api/tickets"].get.summary,
  },
  {
    description: apiContract.paths["/api/tickets/{id}"].get.description,
    method: "GET",
    operationId: apiContract.paths["/api/tickets/{id}"].get.operationId,
    path: "/api/tickets/{id}",
    summary: apiContract.paths["/api/tickets/{id}"].get.summary,
  },
];

const example = `import type { paths } from "./relaydesk-api";

type TicketList =
  paths["/api/tickets"]["get"]["responses"][200]["content"]["application/json"];

const response = await fetch(
  "https://app.relaydesk.dev/api/tickets?filter=urgent",
);

if (!response.ok) throw new Error(\`RelayDesk returned \${response.status}\`);
const queue: TicketList = await response.json();

console.log(queue.meta.returned, queue.data[0]?.subject);`;

export default function ApiReferencePage() {
  return (
    <main className="developer-site">
      <header className="developer-header">
        <Link href="/" aria-label="RelayDesk home"><BrandMark /></Link>
        <nav aria-label="Developer navigation">
          <Link href="/help">Help center</Link>
          <a href="/openapi.json">OpenAPI JSON</a>
          <Link href="/inbox">Open workspace</Link>
        </nav>
      </header>

      <section className="developer-hero">
        <Link href="/"><ArrowLeft size={14} aria-hidden="true" /> RelayDesk</Link>
        <p>Developer platform</p>
        <h1>RelayDesk API reference</h1>
        <span>{apiContract.info.description}</span>
        <div>
          <a href="/openapi.json"><Braces size={15} aria-hidden="true" /> Download OpenAPI</a>
          <Link href="/help/webhook-delivery-and-retries">Webhook guidance <ArrowRight size={14} aria-hidden="true" /></Link>
        </div>
      </section>

      <div className="developer-layout">
        <aside>
          <p>Version</p>
          <strong>{apiContract.info.version}</strong>
          <nav aria-label="API operations">
            {endpoints.map((endpoint) => <a href={`#${endpoint.operationId}`} key={endpoint.operationId}>{endpoint.summary}</a>)}
          </nav>
          <span><CheckCircle2 size={14} aria-hidden="true" /> Contract verified in CI</span>
        </aside>

        <div className="developer-content">
          <section>
            <p>Base URL</p>
            <code>https://app.relaydesk.dev</code>
            <h2>Typed, executable examples</h2>
            <p>
              RelayDesk publishes an OpenAPI 3.1 contract. Generated TypeScript types,
              runtime response checks, and documentation examples are verified from the
              same file on every change.
            </p>
            <div className="developer-code">
              <header><span>TypeScript</span><Copy size={14} aria-hidden="true" /></header>
              <pre><code>{example}</code></pre>
            </div>
          </section>

          <section className="endpoint-list" aria-labelledby="endpoint-title">
            <h2 id="endpoint-title">Operations</h2>
            {endpoints.map((endpoint) => (
              <article id={endpoint.operationId} key={endpoint.operationId}>
                <span>{endpoint.method}</span>
                <code>{endpoint.path}</code>
                <h3>{endpoint.summary}</h3>
                <p>{endpoint.description}</p>
                <small>Operation ID: {endpoint.operationId}</small>
              </article>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
