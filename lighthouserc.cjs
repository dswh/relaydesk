module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      settings: {
        chromeFlags: "--headless --no-sandbox --disable-dev-shm-usage",
        preset: "desktop",
      },
      startServerCommand: "pnpm start",
      startServerReadyPattern: "Ready in|Local:",
      url: ["http://localhost:3000/"],
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
