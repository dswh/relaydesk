module.exports = {
  ci: {
    collect: {
      numberOfRuns: 2,
      settings: {
        chromeFlags: "--headless --no-sandbox --disable-dev-shm-usage",
        preset: "desktop",
      },
      startServerCommand: "PORT=3102 pnpm start",
      startServerReadyPattern: "Ready in|Local:",
      url: [
        "http://localhost:3102/help",
        "http://localhost:3102/help/webhook-delivery-and-retries",
      ],
    },
    assert: {
      assertions: {
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 1 }],
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 1 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
      },
    },
    upload: {
      outputDir: ".lighthouseci-help",
      target: "filesystem",
    },
  },
};
