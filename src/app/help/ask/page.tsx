import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { HelpChat } from "@/components/help-chat";

export const metadata: Metadata = {
  alternates: { canonical: "/help/ask" },
  description:
    "Ask RelayDesk product questions and get answers grounded in approved public help articles.",
  title: "Ask RelayDesk",
};

export default function AskRelayDeskPage() {
  return (
    <main className="help-site help-chat-page">
      <header className="help-header">
        <Link href="/" aria-label="RelayDesk home"><BrandMark /></Link>
        <nav aria-label="Help center navigation">
          <Link href="/help"><ArrowLeft size={14} aria-hidden="true" /> Help center</Link>
          <Link href="/inbox">Open workspace</Link>
        </nav>
      </header>
      <HelpChat />
    </main>
  );
}
