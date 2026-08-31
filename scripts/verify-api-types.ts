import { readFile } from "node:fs/promises";

import openapiTS, { astToString, COMMENT_HEADER } from "openapi-typescript";

const contractUrl = new URL("../openapi/relaydesk.openapi.json", import.meta.url);
const generatedUrl = new URL("../src/lib/relaydesk-api.d.ts", import.meta.url);

const generatedAst = await openapiTS(contractUrl, { silent: true });
const expected = `${COMMENT_HEADER}${astToString(generatedAst)}`;
const actual = await readFile(generatedUrl, "utf8");

if (actual !== expected) {
  console.error("Generated API types are stale.");
  console.error("Run: pnpm api:types");
  process.exitCode = 1;
} else {
  console.log("API types match the OpenAPI contract.");
}
