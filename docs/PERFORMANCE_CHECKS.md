# Public site quality checks

- Check the actual landing page, blog index, and representative long-form article.
- Preserve content, accessibility, structured data, and working links while improving performance.

```sh
pnpm eval:site-quality
```

The command builds the site, runs the blog browser checks, and runs Lighthouse twice on each representative page.
The configured gate requires performance of at least 0.95 and full accessibility, best-practice, and SEO scores.
Core Web Vitals budgets are fixed in `lighthouserc.cjs`.

For the help center:

```sh
pnpm eval:help-center
```

Read `lighthouserc.help.cjs` for its page budgets.
Read the generated reports before choosing the next edit.
Keep the checks and thresholds unchanged during an optimization task.
