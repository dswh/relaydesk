import { expect, test } from "@playwright/test";

import { blogPosts, blogPostWordCount } from "../../src/lib/blog";

test("publishes an eight-article field-note directory", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Systems for support teams");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/blog$/);
  await expect(page.locator('a[href^="/blog/"]')).toHaveCount(blogPosts.length);
});

for (const post of blogPosts) {
  test(`renders ${post.id} as a crawlable long-form article`, async ({ page, request }) => {
    const path = `/blog/${post.slug}`;
    const response = await request.get(path);
    const initialHtml = await response.text();
    expect(response.status()).toBe(200);
    expect(initialHtml).toContain(post.title);
    expect(initialHtml).toContain(post.sections[0].paragraphs[0]);

    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(post.title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new RegExp(`${path}$`),
    );
    const schema = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}",
    ) as Record<string, unknown>;
    expect(schema["@type"]).toBe("BlogPosting");
    expect(schema.headline).toBe(post.title);
    expect(schema.dateModified).toBe(post.updatedAt);
    expect(schema.wordCount).toBe(blogPostWordCount(post));
    expect(blogPostWordCount(post)).toBeGreaterThanOrEqual(1_000);
  });
}

test("exposes every field note to search and answer crawlers", async ({ request }) => {
  const [robots, sitemap, llms] = await Promise.all([
    request.get("/robots.txt").then((response) => response.text()),
    request.get("/sitemap.xml").then((response) => response.text()),
    request.get("/llms.txt").then((response) => response.text()),
  ]);

  expect(robots).not.toContain("Disallow: /blog");
  expect(robots).toContain("Allow: /blog/");
  for (const post of blogPosts) {
    expect(sitemap).toContain(`/blog/${post.slug}`);
    expect(llms).toContain(`/blog/${post.slug}`);
  }
});

test("contains no broken internal links across the field notes", async ({ page, request }) => {
  const paths = ["/", "/blog", ...blogPosts.map((post) => `/blog/${post.slug}`)];
  for (const path of paths) {
    await page.goto(path);
    const hrefs = await page.locator('a[href^="/"]').evaluateAll((anchors) =>
      [...new Set(anchors.map((anchor) => anchor.getAttribute("href")).filter(Boolean))],
    );
    for (const href of hrefs) {
      const response = await request.get(String(href));
      expect(response.status(), `${path} links to ${href}`).toBeLessThan(400);
    }
  }
});

test("keeps the representative article within the mobile viewport", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/blog/designing-a-support-operations-system");
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);
});
