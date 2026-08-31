import { describe, expect, it } from "vitest";

import { filterTickets, getSlaState, summarizeQueue } from "@/lib/inbox";
import { tickets } from "@/lib/tickets";

describe("support queue", () => {
  it("summarizes active workload", () => {
    expect(summarizeQueue(tickets)).toEqual({
      all: 6,
      mine: 2,
      unassigned: 2,
      urgent: 1,
    });
  });

  it("finds tickets by customer, company, subject, tag, or id", () => {
    expect(filterTickets(tickets, "atlas", "all")[0]?.id).toBe("RD-1842");
    expect(filterTickets(tickets, "webhooks", "all")[0]?.id).toBe("RD-1831");
    expect(filterTickets(tickets, "RD-1827", "all")[0]?.customer.name).toBe(
      "Elena Ortiz",
    );
  });

  it("orders urgent work before normal work", () => {
    expect(filterTickets(tickets, "", "all")[0]?.priority).toBe("urgent");
  });

  it("classifies SLA risk from elapsed waiting time", () => {
    expect(getSlaState(tickets[0]!)).toBe("watch");
    expect(getSlaState(tickets[4]!)).toBe("safe");
  });
});
