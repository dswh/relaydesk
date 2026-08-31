# RelayDesk project rules

- RelayDesk is a real customer support operations product. Do not add workshop-only UI or artificial failure fixtures to the product baseline.
- Read the relevant guide in `node_modules/next/dist/docs/` before changing Next.js APIs, conventions, or file structure.
- Keep `main` deployable. Product work uses `codex/` branches and must pass `pnpm verify` before merge.
- Server Components perform reads. Client Components own interactive UI state. Use Route Handlers only for public or integration-facing HTTP APIs.
- Keep customer data synthetic in the repository. Never commit production conversations, secrets, tokens, or personal data.
- Preserve accessible names, keyboard focus, reduced motion, and responsive behavior when changing the interface.
- Workshop scenario branches represent credible historical product states and use measurable acceptance criteria. Read `docs/WORKSHOP_SCENARIOS.md` before creating one.
