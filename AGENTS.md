<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev`. Verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# RelayDesk project rules

- RelayDesk is a real customer support operations product. Do not add workshop-only UI or artificial failure fixtures to the product baseline.
- Keep `main` deployable. Product work uses `codex/` branches and must pass `pnpm verify` before merge.
- Server Components perform reads. Client Components own interactive UI state. Use Route Handlers only for public or integration-facing HTTP APIs.
- Keep customer data synthetic in the repository. Never commit production conversations, secrets, tokens, or personal data.
- Preserve accessible names, keyboard focus, reduced motion, and responsive behavior when changing the interface.
- Workshop scenario branches represent credible historical product states and use measurable acceptance criteria. Read `docs/WORKSHOP_SCENARIOS.md` before creating one.
