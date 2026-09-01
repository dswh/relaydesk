import { defineConfig } from "@playwright/test";

export default defineConfig({
  expect: { timeout: 5_000 },
  fullyParallel: false,
  reporter: "list",
  testDir: "./tests/browser",
  use: {
    baseURL: "http://127.0.0.1:3101",
    channel: "chrome",
    headless: true,
  },
  webServer: {
    command: "PORT=3101 pnpm start",
    reuseExistingServer: false,
    timeout: 120_000,
    url: "http://127.0.0.1:3101/help",
  },
});
