import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    rules: [
      {
        allow: ["/", "/help/", "/developers/", "/openapi.json", "/llms.txt"],
        disallow: [
          "/api/",
          "/analytics",
          "/customers",
          "/help",
          "/inbox",
          "/knowledge",
          "/search",
          "/settings",
        ],
        userAgent: "*",
      },
      {
        allow: ["/help/", "/developers/", "/openapi.json", "/llms.txt"],
        disallow: ["/api/", "/help", "/inbox"],
        userAgent: ["OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "PerplexityBot"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
