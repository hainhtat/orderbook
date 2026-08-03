# Order Notebook — agent index

## Source of truth

- **Spec:** `PROJECT_SPEC.md`
- **Project config:** `.cursor/project.md` (paths, stack, active apps)
- Do not edit the spec during ordinary implementation; use `@spec-maintainer`.

## Global agent-kit

Shared agents and stack skills live in **`~/Developer/agent-kit`**, installed to:

- `~/.cursor/skills/` — run `agent-kit/scripts/install-global.sh` once per machine
- `.cursor/agents/*.md` — symlinks via `agent-kit/scripts/link-project.sh`

This repo adds:

- `.cursor/project.md` — Order Notebook paths and domain notes
- `.cursor/agents/spec-maintainer.md` — local spec-maintainer (not symlinked)

## Subagents

| Agent | Use for |
| --- | --- |
| `@backend-developer` | API, Prisma, services, backend tests |
| `@frontend-developer` | Web UI, hooks, i18n, web tests |
| `@mobile-developer` | Mobile (deferred — see `project.md`) |
| `@spec-maintainer` | Spec updates after approved drift |
| `@test-reviewer` | Post-feature test review |
| `@verifier` | Milestone / spec compliance check |
| `@auditor` | Security and production-risk audit |

Orchestrator: `~/.cursor/skills/orchestrator/SKILL.md` and `.cursorrules`.

## New machine setup

```bash
~/Developer/agent-kit/scripts/install-global.sh
~/Developer/agent-kit/scripts/link-project.sh ~/Developer/pos
```

## Verification

Run typecheck/tests per touched app before claiming milestones complete.
