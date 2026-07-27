# Order Notebook repository guidance

## Source of truth

- Treat `PROJECT_SPEC.md` as the authoritative product and technical contract.
- Read the relevant spec sections before changing code, schemas, migrations, APIs, or user-visible behavior.
- Do not edit `PROJECT_SPEC.md` or `PROJECT_SPEC.html` during ordinary implementation. Use `$spec-maintainer` for evidence-based spec synchronization.
- Preserve user changes and keep diffs scoped. Reuse established repository patterns before adding abstractions.

## Applications and stack

| Area | Path | Stack |
| --- | --- | --- |
| Web | `frontend/` | React, Vite, TypeScript, React Query, React Router, React Hook Form, shadcn/ui, Tailwind |
| Backend | `backend/` | Express, TypeScript, Prisma, SQLite (dev/test), PostgreSQL (production), JWT |
| Mobile (deferred) | `mobile/` | React Native, Expo, Expo Router, Expo UI |
| AI assistant | backend only | DeepSeek `deepseek-chat`, OpenAI-compatible API, per-shop BYOK |

Keep LLM credentials server-side. Never place secrets in `VITE_*` or `EXPO_PUBLIC_*` variables. Backend development requires `AI_ENCRYPTION_KEY`; local DeepSeek use reads `DEEPSEEK_API_KEY` from `backend/.env`.

## Native OpenAI skills

Repository skills live in `.agents/skills/` and follow the Agent Skills format so they can be used by Codex and uploaded to ChatGPT.

Current delivery priority is the web application. Treat mobile implementation as deferred unless the user explicitly reactivates it for a task or phase.

Web UI work must be mobile-first: start from narrow viewports and touch interaction, then enhance for tablet and desktop. Preserve accessible semantics, responsive layouts, and parity across English/Myanmar strings.

Use the focused specialist skill when work is predominantly in one boundary:

- `$backend-developer` for backend routes, services, Prisma, auth, tenancy, reports, AI endpoints, and backend tests.
- `$frontend-developer` for the web staff console, React routes/pages/forms, queries, i18n, theme, and web tests.
- `$mobile-developer` only when the user explicitly brings mobile back into the active phase.
- `$spec-maintainer` after approved contract, architecture, schema, API, or milestone changes.
- `$test-reviewer` for an independent tests-only review after feature work.
- `$verifier` for read-only correctness and spec-compliance verification.
- `$auditor` for a report-only security, performance, reliability, and scalability audit.

Use `$frontend-starter`, `$backend-starter`, or `$mobile-starter` only when scaffolding or standardizing the respective application. Use `$test` for a small, high-value set of behavior-focused tests.

If subagents are available and the request explicitly permits delegation, specialist work may be delegated. Otherwise apply the corresponding skill directly. Split cross-cutting features by contract boundary: backend API first, then web and mobile consumers. The primary agent may make small shared contract-alignment changes.

## Verification

Run the narrowest relevant checks first, then the applicable app-level typecheck, tests, lint, and build/export checks. Do not claim completion while failures caused by the work remain. Report commands run, results, assumptions, migrations or environment changes, API dependencies, and whether `$spec-maintainer` should run.

## Environment files

- `backend/.env`: database, JWT, CORS, `AI_ENCRYPTION_KEY`, `DEEPSEEK_API_KEY`
- `frontend/.env`: `VITE_API_BASE_URL` only
- `mobile/.env`: `EXPO_PUBLIC_API_BASE_URL` only

Copy from each app's `.env.example`. Never commit `.env` files.
