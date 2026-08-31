import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    rules: {
      allow: "/",
      disallow: ["/api/", "/inbox", "/customers", "/knowledge", "/analytics"],
      userAgent: "*",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
