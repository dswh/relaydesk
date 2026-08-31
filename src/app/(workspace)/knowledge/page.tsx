import {
  ArrowUpRight,
  BookOpenText,
  CheckCircle2,
  FileText,
  Plus,
  Search,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Knowledge",
};

const articles = [
  { title: "Verify a domain for SSO", collection: "Identity", status: "Published", uses: 186, freshness: "Updated 2d ago" },
  { title: "Export usage and billing data", collection: "Billing", status: "Published", uses: 142, freshness: "Updated 5d ago" },
  { title: "Control AI knowledge sources", collection: "AI assistant", status: "Published", uses: 98, freshness: "Updated today" },
  { title: "Webhook delivery and retries", collection: "Developers", status: "Review", uses: 73, freshness: "Changed in code" },
  { title: "Invite teammates to a workspace", collection: "Workspace", status: "Published", uses: 65, freshness: "Updated 8d ago" },
];

export default function KnowledgePage() {
  return (
    <div className="section-screen">
      <header className="section-header">
        <div>
          <div className="page-kicker"><span /> Approved answers</div>
          <h1>Knowledge</h1>
          <p>Publish accurate guidance for customers, agents, and AI replies.</p>
        </div>
        <button className="primary-button" type="button"><Plus size={16} aria-hidden="true" /> New article</button>
      </header>

      <div className="knowledge-overview">
        <section className="knowledge-health">
          <div className="health-score"><strong>92</strong><span>/100</span></div>
          <div>
            <span className="eyebrow">Knowledge health</span>
            <h2>Answers are well covered</h2>
            <p>One developer article needs review after a product change.</p>
          </div>
          <CheckCircle2 size={22} aria-hidden="true" />
        </section>
        <section className="knowledge-stat"><span>Coverage</span><strong>87%</strong><small>+4.2% this month</small></section>
        <section className="knowledge-stat"><span>AI citations</span><strong>564</strong><small>in the last 30 days</small></section>
      </div>

      <section className="directory-card">
        <div className="directory-toolbar">
          <label className="directory-search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">Search knowledge</span>
            <input placeholder="Search articles and collections" type="search" />
          </label>
          <button className="secondary-button" type="button">All collections</button>
        </div>
        <div className="article-list">
          {articles.map((article) => (
            <button className="article-row" key={article.title} type="button">
              <span className="article-icon"><FileText size={17} aria-hidden="true" /></span>
              <span className="article-main"><strong>{article.title}</strong><small>{article.collection}</small></span>
              <span className={`article-status ${article.status === "Review" ? "review" : ""}`}><i /> {article.status}</span>
              <span className="article-use"><BookOpenText size={14} aria-hidden="true" /> {article.uses} uses</span>
              <span className={article.status === "Review" ? "freshness-warning" : ""}>{article.freshness}</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
