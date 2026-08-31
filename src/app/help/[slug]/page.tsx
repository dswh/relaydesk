import { ArrowLeft, ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import {
  getPublicKnowledgeArticle,
  publicKnowledgeArticles,
} from "@/lib/knowledge";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return publicKnowledgeArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getPublicKnowledgeArticle(slug);
  if (!article) return {};

  return {
    alternates: { canonical: `/help/${article.slug}` },
    description: article.description,
    openGraph: {
      description: article.description,
      title: article.title,
      type: "article",
    },
    title: article.title,
  };
}

export default async function HelpArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getPublicKnowledgeArticle(slug);
  if (!article) notFound();

  const articleUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/help/${article.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    dateModified: article.updatedAt,
    datePublished: article.publishedAt,
    description: article.description,
    headline: article.title,
    mainEntityOfPage: articleUrl,
    publisher: {
      "@type": "Organization",
      name: "RelayDesk",
      url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    },
  };

  return (
    <main className="help-site">
      <header className="help-header">
        <Link href="/" aria-label="RelayDesk home"><BrandMark /></Link>
        <nav aria-label="Help center navigation">
          <Link href="/help">Help center</Link>
          <Link href="/developers/api">API reference</Link>
        </nav>
      </header>

      <article className="help-article">
        <aside>
          <Link href="/help"><ArrowLeft size={14} aria-hidden="true" /> All articles</Link>
          <p>{article.collection}</p>
          <span><Clock3 size={13} aria-hidden="true" /> {article.minutes} minute read</span>
          <span><CheckCircle2 size={13} aria-hidden="true" /> Verified guidance</span>
        </aside>

        <div className="help-article-body">
          <header>
            <p>{article.collection}</p>
            <h1>{article.title}</h1>
            <p>{article.description}</p>
            <small>
              Published <time dateTime={article.publishedAt}>{article.publishedAt}</time>
              {" · "}Updated <time dateTime={article.updatedAt}>{article.updatedAt}</time>
            </small>
          </header>

          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.steps && (
                <ol>
                  {section.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              )}
            </section>
          ))}

          <footer>
            <span>Article ID {article.id}</span>
            <Link href="/inbox">Still need help? Open RelayDesk <ArrowRight size={14} aria-hidden="true" /></Link>
          </footer>
        </div>
      </article>

      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        type="application/ld+json"
      />
    </main>
  );
}
