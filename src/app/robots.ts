import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    rules: [
      {
        allow: ["/", "/blog/", "/help/", "/developers/", "/openapi.json", "/llms.txt"],
        disallow: [
          "/api/",
          "/analytics",
          "/customers",
          "/inbox",
          "/knowledge",
          "/search",
          "/settings",
        ],
        userAgent: "*",
      },
      {
        allow: ["/blog/", "/help/", "/developers/", "/openapi.json", "/llms.txt"],
        disallow: ["/api/", "/inbox"],
        userAgent: ["OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "PerplexityBot"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
