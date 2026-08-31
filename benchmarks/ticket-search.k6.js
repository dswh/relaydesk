import http from "k6/http";
import { check } from "k6";

export const options = {
  scenarios: {
    sustained_queue_search: {
      executor: "constant-vus",
      vus: 10,
      duration: "30s",
    },
  },
  thresholds: {
    checks: ["rate>0.99"],
    http_req_duration: ["p(95)<300"],
    http_req_failed: ["rate<0.01"],
  },
};

const baseUrl = __ENV.BASE_URL || "http://host.docker.internal:3000";
const terms = [
  "billing export",
  "webhook retry",
  "SSO verification",
  "data migration",
  "team permissions",
  "API attachment",
  "invoice correction",
  "account access",
];

export default function searchTickets() {
  const term = terms[__ITER % terms.length];
  const response = http.get(
    `${baseUrl}/api/tickets?q=${encodeURIComponent(term)}&filter=all`,
  );

  check(response, {
    "returns HTTP 200": (result) => result.status === 200,
    "uses PostgreSQL": (result) =>
      result.headers["X-Relaydesk-Data-Source"] === "postgres",
    "returns matching tickets": (result) => {
      const payload = result.json();
      return Array.isArray(payload.data) && payload.data.length > 0;
    },
  });
}

