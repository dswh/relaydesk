export function GET() {
  return Response.json({
    status: "ok",
    service: "relaydesk-web",
    timestamp: new Date().toISOString(),
  });
}
