import { expect, test } from "@playwright/test";

import { publicKnowledgeArticles } from "../../src/lib/knowledge";

test("publishes a crawlable help directory", async ({ page }) => {
  await page.goto("/help");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Verified answers");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/help$/);
  await expect(page.getByRole("link", { name: "Read article" })).toHaveCount(
    publicKnowledgeArticles.length,
  );
});

for (const article of publicKnowledgeArticles) {
  test(`renders ${article.id} with metadata and structured data`, async ({ page }) => {
    await page.goto(`/help/${article.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(article.title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new RegExp(`/help/${article.slug}$`),
    );
    const schema = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}",
    ) as Record<string, unknown>;
    expect(schema["@type"]).toBe("TechArticle");
    expect(schema.headline).toBe(article.title);
    expect(schema.dateModified).toBe(article.updatedAt);
  });
}

test("exposes every public article to search and answer crawlers", async ({ request }) => {
  const [robots, sitemap, llms] = await Promise.all([
    request.get("/robots.txt").then((response) => response.text()),
    request.get("/sitemap.xml").then((response) => response.text()),
    request.get("/llms.txt").then((response) => response.text()),
  ]);

  expect(robots).not.toContain("Disallow: /help");
  expect(robots).toContain("OAI-SearchBot");
  for (const article of publicKnowledgeArticles) {
    expect(sitemap).toContain(`/help/${article.slug}`);
    expect(llms).toContain(`/help/${article.slug}`);
  }
});

test("publishes the contract-driven developer reference", async ({ page, request }) => {
  await page.goto("/developers/api");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "RelayDesk API reference",
  );
  await expect(page.locator(".endpoint-list article")).toHaveCount(3);
  expect((await request.get("/openapi.json")).status()).toBe(200);
});

test("contains no broken internal links on public help pages", async ({ page, request }) => {
  const paths = new Set<string>(["/developers/api", "/help"]);
  for (const article of publicKnowledgeArticles) paths.add(`/help/${article.slug}`);

  for (const path of paths) {
    await page.goto(path);
    const hrefs = await page.locator('a[href^="/"]').evaluateAll((anchors) =>
      anchors.map((anchor) => anchor.getAttribute("href")).filter(Boolean),
    );
    for (const href of hrefs) {
      const response = await request.get(String(href));
      expect(response.status(), `${path} links to ${href}`).toBeLessThan(400);
    }
  }
});
