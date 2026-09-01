import { ArrowLeft, ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { blogPosts, blogPostWordCount, getBlogPost } from "@/lib/blog";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = getBlogPost((await params).slug);
  if (!post) return {};

  return {
    alternates: { canonical: `/blog/${post.slug}` },
    description: post.description,
    openGraph: {
      description: post.description,
      publishedTime: post.publishedAt,
      title: post.title,
      type: "article",
    },
    title: post.title,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const post = getBlogPost((await params).slug);
  if (!post) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const related = blogPosts.filter((candidate) => candidate.id !== post.id).slice(0, 3);
  const wordCount = blogPostWordCount(post);
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    author: { "@type": "Person", name: post.author },
    dateModified: post.updatedAt,
    datePublished: post.publishedAt,
    description: post.description,
    headline: post.title,
    inLanguage: "en",
    isPartOf: { "@type": "Blog", name: "RelayDesk field notes", url: `${baseUrl}/blog` },
    mainEntityOfPage: `${baseUrl}/blog/${post.slug}`,
    publisher: { "@type": "Organization", name: "RelayDesk" },
    wordCount,
  };

  return (
    <main className="blog-site">
      <header className="blog-header">
        <Link href="/" aria-label="RelayDesk home"><BrandMark /></Link>
        <nav aria-label="Public navigation">
          <Link href="/blog">All field notes</Link>
          <Link href="/help">Help center</Link>
          <Link className="blog-header-cta" href="/inbox">Open workspace</Link>
        </nav>
      </header>

      <article className="blog-post">
        <header className="blog-post-hero">
          <Link href="/blog"><ArrowLeft size={14} aria-hidden="true" /> Field notes</Link>
          <div className="blog-post-heading">
            <div>
              <p>{post.category}</p>
              <h1>{post.title}</h1>
            </div>
            <p>{post.description}</p>
          </div>
          <div className="blog-post-meta">
            <span>By {post.author}</span>
            <span><Clock3 size={13} aria-hidden="true" /> {post.readingMinutes} min read</span>
            <span>{wordCount.toLocaleString()} words</span>
            <time dateTime={post.updatedAt}>Updated {post.updatedAt}</time>
          </div>
          <div className="blog-post-cover" aria-hidden="true">
            <span>RelayDesk field note</span>
            <strong>{post.category}</strong>
            <i />
            <b>{post.id.replace("blog_", "0")}</b>
          </div>
        </header>

        <div className="blog-post-layout">
          <aside>
            <p>In this guide</p>
            <nav aria-label="Article contents">
              {post.sections.map((section, index) => (
                <a href={`#section-${index + 1}`} key={section.heading}>
                  <span>{String(index + 1).padStart(2, "0")}</span> {section.heading}
                </a>
              ))}
            </nav>
          </aside>

          <div className="blog-post-body">
            <section className="blog-takeaways" aria-labelledby="takeaways-heading">
              <p id="takeaways-heading">Key takeaways</p>
              <ul>
                {post.takeaways.map((takeaway) => (
                  <li key={takeaway}><CheckCircle2 size={16} aria-hidden="true" /> {takeaway}</li>
                ))}
              </ul>
            </section>

            {post.sections.map((section, index) => (
              <section id={`section-${index + 1}`} key={section.heading}>
                <span className="blog-section-number">{String(index + 1).padStart(2, "0")}</span>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets && (
                  <ul className="blog-bullet-list">
                    {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                  </ul>
                )}
                {section.table && (
                  <div className="blog-table-wrap">
                    <table>
                      <thead><tr>{section.table.headers.map((header) => <th key={header} scope="col">{header}</th>)}</tr></thead>
                      <tbody>
                        {section.table.rows.map((row) => (
                          <tr key={row.join("-")}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {section.code && <pre><code>{section.code}</code></pre>}
              </section>
            ))}

            <footer className="blog-post-footer">
              <span>Published <time dateTime={post.publishedAt}>{post.publishedAt}</time></span>
              <Link href="/blog">Explore all field notes <ArrowRight size={14} aria-hidden="true" /></Link>
            </footer>
          </div>
        </div>
      </article>

      <section className="blog-related" aria-labelledby="related-heading">
        <p>Continue learning</p>
        <h2 id="related-heading">Related field notes</h2>
        <div>
          {related.map((candidate) => (
            <article key={candidate.id}>
              <span>{candidate.category}</span>
              <h3>{candidate.title}</h3>
              <Link href={`/blog/${candidate.slug}`}>Read article <ArrowRight size={13} aria-hidden="true" /></Link>
            </article>
          ))}
        </div>
      </section>

      <footer className="blog-footer">
        <BrandMark />
        <p>Field notes for reliable support operations.</p>
        <Link href="/">RelayDesk product</Link>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
      />
    </main>
  );
}
