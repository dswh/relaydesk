import type { paths } from "../src/lib/relaydesk-api";

type TicketListResponse =
  paths["/api/tickets"]["get"]["responses"][200]["content"]["application/json"];

export async function listUrgentTickets(
  fetcher: typeof fetch = fetch,
): Promise<TicketListResponse> {
  const response = await fetcher("http://localhost:3000/api/tickets?filter=urgent");
  if (!response.ok) throw new Error(`RelayDesk returned ${response.status}`);
  return response.json() as Promise<TicketListResponse>;
}
