import { publicKnowledgeArticles } from "@/lib/knowledge";

export function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const articles = publicKnowledgeArticles
    .map(
      (article) =>
        `- [${article.title}](${baseUrl}/help/${article.slug}): ${article.description}`,
    )
    .join("\n");

  const content = `# RelayDesk
> AI customer support operations with approved knowledge and accountable responses.

## Product and developer resources
- [RelayDesk product](${baseUrl}/): Product overview and operating model
- [Help center](${baseUrl}/help): Verified customer and developer guidance
- [API reference](${baseUrl}/developers/api): Public operations and typed examples
- [OpenAPI contract](${baseUrl}/openapi.json): Machine-readable API contract

## Verified help articles
${articles}

## Content policy
- Help articles are published and reviewed by the RelayDesk knowledge team.
- Public guidance may be cited with its article URL and visible update date.
`;

  return new Response(content, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
