import { ArrowRight, BookOpenText, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { publicKnowledgeArticles } from "@/lib/knowledge";

export const metadata: Metadata = {
  alternates: { canonical: "/help" },
  description:
    "Find verified RelayDesk guidance for SSO, AI knowledge controls, billing exports, webhooks, and workspace administration.",
  title: "RelayDesk help center",
};

export default function HelpCenterPage() {
  return (
    <main className="help-site">
      <header className="help-header">
        <Link href="/" aria-label="RelayDesk home"><BrandMark /></Link>
        <nav aria-label="Help center navigation">
          <Link href="/developers/api">API reference</Link>
          <Link href="/inbox">Open workspace</Link>
        </nav>
      </header>

      <section className="help-hero">
        <p>RelayDesk help center</p>
        <h1>Verified answers for reliable support operations.</h1>
        <label className="help-search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Search help articles</span>
          <input placeholder="Search SSO, webhooks, exports, and more" type="search" />
        </label>
      </section>

      <section className="help-directory" aria-labelledby="help-directory-title">
        <div>
          <p>Approved guidance</p>
          <h2 id="help-directory-title">Start with a verified article.</h2>
        </div>
        <div className="help-article-grid">
          {publicKnowledgeArticles.map((article) => (
            <article key={article.id}>
              <span><BookOpenText size={17} aria-hidden="true" /> {article.collection}</span>
              <h3><Link href={`/help/${article.slug}`}>{article.title}</Link></h3>
              <p>{article.description}</p>
              <Link href={`/help/${article.slug}`}>
                Read article <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <footer className="help-footer">
        <BrandMark />
        <p>Answers are reviewed by the RelayDesk knowledge team.</p>
        <Link href="/">relaydesk.dev</Link>
      </footer>
    </main>
  );
}
