import { ArrowRight, BookOpen, Clock3 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { blogPosts, blogPostWordCount } from "@/lib/blog";

export const metadata: Metadata = {
  alternates: { canonical: "/blog" },
  description:
    "Practical field guides for building reliable customer support operations, grounded AI systems, knowledge programs, and integrations.",
  title: "Support operations field notes",
};

export default function BlogIndexPage() {
  const featured = blogPosts.filter((post) => post.featured);
  const remaining = blogPosts.filter((post) => !post.featured);

  return (
    <main className="blog-site">
      <header className="blog-header">
        <Link href="/" aria-label="RelayDesk home">
          <BrandMark />
        </Link>
        <nav aria-label="Public navigation">
          <Link href="/">Product</Link>
          <Link href="/help">Help center</Link>
          <Link className="blog-header-cta" href="/inbox">Open workspace</Link>
        </nav>
      </header>

      <section className="blog-index-hero">
        <div>
          <p>RelayDesk field notes</p>
          <h1>Systems for support teams that care about the decision.</h1>
        </div>
        <p>
          Detailed, practical guides for designing accountable operations, reliable
          integrations, measurable AI quality, and customer knowledge that holds up
          under real work.
        </p>
      </section>

      <section className="blog-featured" aria-labelledby="featured-heading">
        <div className="blog-section-label">
          <BookOpen size={15} aria-hidden="true" />
          <span id="featured-heading">Editor&apos;s selection</span>
        </div>
        <div className="blog-featured-grid">
          {featured.map((post, index) => (
            <article className="blog-featured-card" key={post.id}>
              <div className="blog-cover" data-tone={String(index + 1)} aria-hidden="true">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <i />
                <b>{post.category}</b>
              </div>
              <div>
                <p>{post.category}</p>
                <h2>{post.title}</h2>
                <span>{post.description}</span>
                <footer>
                  <small><Clock3 size={12} aria-hidden="true" /> {post.readingMinutes} min read</small>
                  <Link href={`/blog/${post.slug}`}>
                    Read field note <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </footer>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="blog-library" aria-labelledby="library-heading">
        <div>
          <p>Complete library</p>
          <h2 id="library-heading">Deep guides, written for operators.</h2>
        </div>
        <div className="blog-library-grid">
          {remaining.map((post, index) => (
            <article key={post.id}>
              <div className="blog-card-index">{String(index + 4).padStart(2, "0")}</div>
              <p>{post.category}</p>
              <h3>{post.title}</h3>
              <span>{post.description}</span>
              <footer>
                <small>{blogPostWordCount(post).toLocaleString()} words</small>
                <Link href={`/blog/${post.slug}`} aria-label={`Read ${post.title}`}>
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </footer>
            </article>
          ))}
        </div>
      </section>

      <footer className="blog-footer">
        <BrandMark />
        <p>Field notes for reliable support operations.</p>
        <Link href="/">RelayDesk product</Link>
      </footer>
    </main>
  );
}
