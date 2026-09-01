import { describe, expect, it } from "vitest";

import { blogPosts, blogPostWordCount, getBlogPost } from "@/lib/blog";

describe("RelayDesk field notes", () => {
  it("publishes eight unique long-form articles", () => {
    expect(blogPosts).toHaveLength(8);
    expect(new Set(blogPosts.map((post) => post.id)).size).toBe(8);
    expect(new Set(blogPosts.map((post) => post.slug)).size).toBe(8);
    for (const post of blogPosts) expect(blogPostWordCount(post)).toBeGreaterThanOrEqual(1_000);
  });

  it("resolves every published slug", () => {
    for (const post of blogPosts) expect(getBlogPost(post.slug)?.id).toBe(post.id);
  });
});
