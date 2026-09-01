import { expect, test } from "@playwright/test";

test("answers from approved evidence and exposes the supporting source", async ({ page }) => {
  await page.goto("/help/ask");
  await expect(page.getByRole("heading", { level: 1, name: "Ask RelayDesk" })).toBeVisible();

  const question = page.getByLabel("Ask a RelayDesk question");
  await question.fill("How long can SSO domain verification take?");
  await question.press("Enter");

  await expect(page.getByRole("status")).toHaveText("Answer complete");
  const answer = page.locator(".help-chat-message.assistant").last();
  await expect(answer).toContainText("24 hours");
  await expect(answer.getByRole("link", { name: /Verify a domain for SSO/ })).toHaveAttribute(
    "href",
    "/help/verify-domain-for-sso",
  );

  await page.getByRole("button", { name: "New chat" }).click();
  await expect(question).toBeFocused();
});

test("shows a safe no-source answer without a citation", async ({ page }) => {
  await page.goto("/help/ask");
  const question = page.getByLabel("Ask a RelayDesk question");
  await question.fill("Does RelayDesk support SCIM group push?");
  await page.getByRole("button", { name: "Send question" }).click();

  await expect(page.getByRole("status")).toHaveText("Answer complete");
  const answer = page.locator(".help-chat-message.assistant").last();
  await expect(answer).toContainText("could not verify");
  await expect(answer.locator(".help-chat-sources")).toHaveCount(0);
});

test("preserves prior user context for a follow-up question", async ({ page }) => {
  await page.goto("/help/ask");
  const question = page.getByLabel("Ask a RelayDesk question");
  await question.fill("How do restricted AI knowledge collections work?");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByRole("status")).toHaveText("Answer complete");

  await question.fill("Who can change which collections a queue can use?");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByRole("status")).toHaveText("Answer complete");
  await expect(page.locator(".help-chat-message.assistant").last()).toContainText(
    "Workspace administrators",
  );
});
