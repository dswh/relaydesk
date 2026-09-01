import type { MetadataRoute } from "next";

import { blogPosts } from "@/lib/blog";
import { publicKnowledgeArticles } from "@/lib/knowledge";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return [
    {
      changeFrequency: "weekly",
      lastModified: new Date(),
      priority: 1,
      url: baseUrl,
    },
    {
      changeFrequency: "weekly",
      lastModified: new Date("2026-09-01"),
      priority: 0.9,
      url: `${baseUrl}/help`,
    },
    {
      changeFrequency: "weekly",
      lastModified: new Date("2026-09-02"),
      priority: 0.85,
      url: `${baseUrl}/help/ask`,
    },
    {
      changeFrequency: "weekly",
      lastModified: new Date("2026-09-01"),
      priority: 0.9,
      url: `${baseUrl}/blog`,
    },
    {
      changeFrequency: "monthly",
      lastModified: new Date("2026-09-01"),
      priority: 0.7,
      url: `${baseUrl}/developers/api`,
    },
    ...publicKnowledgeArticles.map((article) => ({
      changeFrequency: "monthly" as const,
      lastModified: new Date(article.updatedAt),
      priority: 0.8,
      url: `${baseUrl}/help/${article.slug}`,
    })),
    ...blogPosts.map((post) => ({
      changeFrequency: "monthly" as const,
      lastModified: new Date(post.updatedAt),
      priority: post.featured ? 0.85 : 0.75,
      url: `${baseUrl}/blog/${post.slug}`,
    })),
  ];
}
