import type { Metadata } from "next";

import { InboxWorkspace } from "@/components/inbox-workspace";
import { tickets } from "@/lib/tickets";

export const metadata: Metadata = {
  title: "Inbox",
};

export default function InboxPage() {
  return <InboxWorkspace initialTickets={tickets} />;
}
