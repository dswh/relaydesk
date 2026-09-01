module.exports = {
  ci: {
    collect: {
      numberOfRuns: 2,
      settings: {
        chromeFlags: "--headless --no-sandbox --disable-dev-shm-usage",
        preset: "desktop",
      },
      startServerCommand: "PORT=3100 pnpm start",
      startServerReadyPattern: "Ready in|Local:",
      url: [
        "http://localhost:3100/",
        "http://localhost:3100/blog",
        "http://localhost:3100/blog/designing-a-support-operations-system",
      ],
    },
    assert: {
      assertions: {
        "categories:accessibility": ["error", { minScore: 1 }],
        "categories:best-practices": ["error", { minScore: 1 }],
        "categories:performance": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 1 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "speed-index": ["error", { maxNumericValue: 3000 }],
        "total-blocking-time": ["error", { maxNumericValue: 200 }],
      },
    },
    upload: {
      outputDir: ".lighthouseci",
      target: "filesystem",
    },
  },
};
