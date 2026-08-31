import { Search } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <div className="centered-tool">
      <span className="tool-icon"><Search size={22} aria-hidden="true" /></span>
      <h1>Search RelayDesk</h1>
      <p>Find conversations, customers, and knowledge from one place.</p>
      <label className="global-search"><Search size={19} aria-hidden="true" /><input autoFocus placeholder="Search by customer, topic, or ticket ID" /></label>
    </div>
  );
}
