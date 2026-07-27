---
name: test
description: Write and run a small, high-value set of tests for the code being changed. Focus on critical business logic, public APIs, edge cases, regressions, and bug fixes. Use when implementing or fixing behavior, adding focused regression coverage, or validating important changes without chasing exhaustive coverage.
---

# Test

Write and run a small, high-value set of tests for the code being changed. Prefer fast, behavior-focused coverage over broad or implementation-heavy tests.

## When to use

Use this skill when:

- changing business logic or public APIs
- fixing bugs or regressions
- adding behavior where a focused test reduces risk
- touching code that already has nearby test patterns worth extending

Do not use this skill to add low-value tests purely to raise coverage numbers.

## Core rules

- Test the changed behavior, not the internal implementation.
- Prefer extending existing tests before creating new suites.
- Keep scope narrow: cover the highest-risk paths first.
- Favor a small number of meaningful assertions over many repetitive cases.
- Run only the most relevant tests when possible.
- If a full suite is needed to verify safety, say why.

## What to prioritize

1. Critical business logic
2. Public API contracts
3. User-visible regressions
4. Edge cases likely to break in production
5. Bug fixes that need permanent regression coverage

## What to avoid

- snapshot-heavy tests with little signal
- tests that restate the implementation line by line
- duplicate coverage of the same behavior in multiple layers
- brittle mocks that make refactors hard
- broad test expansion unrelated to the current change

## Workflow

1. Inspect the changed code and nearby tests.
2. Identify the smallest set of behaviors that would catch a real regression.
3. Reuse existing test helpers, factories, and patterns.
4. Add or update only the tests needed for confidence.
5. Run the narrowest relevant test command first.
6. If failures occur, explain them concisely and fix only issues related to the task.
7. If useful, run one broader verification command before finishing.

## Test selection guidance

Choose the lowest-cost command that still validates the change:

- single test file for a localized UI or unit change
- feature-level suite for shared logic or public API changes
- integration test for route/controller/service behavior
- broader app suite only when the change crosses boundaries

Examples:

- frontend component or hook: run the relevant Vitest file
- backend route/service change: run the relevant Jest unit or integration file
- mobile screen flow: run the focused Jest / React Native Testing Library test

## Good test targets

### Business logic

- state transitions
- pricing, totals, balances, or inventory math
- validation and error handling
- authorization and tenancy boundaries

### Public APIs

- request/response shape
- status codes
- stable error codes
- important query or mutation behavior

### UI behavior

- loading, empty, success, and error states
- form validation users can see
- regression-prone navigation or actions

## Reporting format

When finishing test work, report:

1. what behavior is now covered
2. what test files were added or changed
3. what commands were run
4. any failing or skipped verification and why

If you decide not to add tests, state why the change does not justify them.
