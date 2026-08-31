import apiContract from "../../../openapi/relaydesk.openapi.json";

export function GET() {
  return Response.json(apiContract, {
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  });
}
