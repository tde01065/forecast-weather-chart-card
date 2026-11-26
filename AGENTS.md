# Agent instructions

## Scope and sources of truth

This is a generic open-source Home Assistant custom weather card fork of w4mhi/weather-chart-card-ha. Read README.md, DEPLOYMENT.md, docs/BASELINE.md, docs/BACKLOG.md and relevant source/tests before changing behavior. Preserve MIT licensing, third-party notices and upstream attribution. Do not add consumer-specific entity IDs, secrets or operational configuration to component code.

## Work discipline

- Confirm current branch, clean tracked worktree, origin/upstream and revision before editing. Work in the current approved checkout/branch; no worktrees or unrelated changes. Use a new branch per coherent task when approved. Never overwrite user changes.
- Agree on scope and design before implementing a backlog item. Prefer minimal, upstream-compatible changes; extract pure functions only where useful. Preserve existing configuration defaults and custom element/package/bundle identifiers unless explicitly approved.
- Treat missing/invalid data, source units, fallback provenance and subscription lifecycle as correctness concerns, not cosmetic issues. Add regression tests for actual defects, including negative controls. Clearly distinguish observation, hypothesis and evidence.
- Keep a stepwise workflow: one executable step, wait for user output, verify before proceeding. On Windows use PowerShell. The operator handles local execution and production access; do not assume a command has run. For remote Boat Assistant operations use ssh boatassistant from PowerShell, with output visible and copied using Set-Clipboard.
- Do not deploy to production, publish tags/releases, merge PRs or change global resources without explicit approval. A test dashboard alone does not isolate the custom element. Use controlled test environments.
- Use CodeScene quality checks when available/configured; report unavailable tooling rather than claiming a pass. Avoid regressions and explain meaningful trade-offs.

## Validation

Use the existing lockfile and npm ci. Primary CI environment is Node 22 on Ubuntu 24.04; Windows development baseline is also documented. Run npm run build (icons, lint, Rollup), npm test, and npm run test:rtl (Playwright Chromium; install browser if needed). Verify generated dist matches source and is reproducible; FWC-11 is an outstanding Windows baseline defect. Do not commit an unexplained bundle diff. Follow DEPLOYMENT.md for release-specific version, changelog and artifact rules; do not bump version or regenerate artifacts for documentation-only changes without reason. Preserve LTR/RTL behavior, locale fallback, offline runtime and existing tests. Add targeted tests before or alongside fixes.

## Reporting and handoff

Report exact changed files, revision, commands, pass/fail counts, environment, artifact hash where relevant, and limitations. Update backlog status and evidence as changes are verified; do not rewrite historical baseline as though new tests ran then. Keep production integration instructions in the consuming repository. First implementation candidate is FWC-11; begin with design and regression-test plan, not a broad refactor.
