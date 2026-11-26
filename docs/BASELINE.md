# Development baseline

Recorded 2026-11-26. This is a historical evidence record, not a claim that subsequent revisions pass the same tests.

## Provenance and scope

- Fork: https://github.com/tde01065/forecast-weather-chart-card
- Upstream: https://github.com/w4mhi/weather-chart-card-ha
- Baseline: `5773a24c3a3d9ccf48655a1ba6175aea9843a972` (2026-11-15, package version 1.10.0; not assumed to be a released tag).
- The fork was chosen over MStapelfeldt/forcast-weather-chart-card, revision d1818223d707a24db4eadc622477fdc4dd730613. Their common base was 6c851d053a871e51d6c763ca74a396f33092e4c5; W4MHI had 57 unique commits versus 2. W4MHI offers active maintenance, tests, bundled icons and a more mature implementation.
- Preserve package and custom-element name weather-chart-card-ha, dist/weather-chart-card-ha.js, upstream provenance, MIT license and third-party notices. Prefer upstream-compatible changes and contribute useful fixes upstream.
- Local Windows checkout: C:/src/personal/forecast-weather-chart-card; origin is the fork, upstream is W4MHI. At initial verification all three heads matched the baseline.

## Build and test evidence

| Check | Environment | Result |
|---|---|---|
| npm ci | Windows, Node 24.22.1, npm 11.19.1 | 171 packages, 0 reported vulnerabilities |
| npm run build | Windows | Lint and bundle passed; bundle differs (FWC-11) |
| npm test | Windows | 40/40 |
| npm run test:rtl | Windows, Playwright 1.56.1, Chromium 141.0.7390.37 | 20/20 |
| npm ci and npm run build | node:22-bookworm-slim, Node 22.23.4, npm 10.9.9 | PASS; exact upstream bundle |
| npm test | Same Linux container | 40/40 |

100 test executions, 60 unique tests. Linux browser tests and full Ubuntu CI were not run locally. CI at this baseline uses Ubuntu 24.04, Node 22, npm ci, high-severity audit, build, unit tests, committed dist equality, Playwright Chromium regressions and HACS metadata checks. The Linux container was a copied workspace from a read-only mount, not a production deployment.

- package-lock.json SHA-256: 34B993DE7B3DAA8AED7241ADAEB37876ECAFE4EC22F4542C45529044F6745848 (unchanged).
- Upstream bundle: 580441 bytes, SHA-256 1B20E67A913A0173A6BBA9B880CC2A2515285B06D8F1E52D478BC6CE1D6238F7.
- Windows uncorrected bundle: 580498 bytes, SHA-256 551D6846751E9A8EB808FB647B92DB425F3DD206D52D6FE2B096D679E4DA3E23.
- Isolated plugin experiments established that rollup.version.mjs checks for /src/ in a module ID, which on Windows contains backslashes. Normalizing the ID in memory before the check produced a byte-identical upstream bundle. The defect is confirmed; no permanent fix was committed. Temporary diagnostic files were removed and the committed dist restored.
- Two early diagnostics failed because Terser workers inherited --input-type=module; a temporary .mjs script resolved the diagnostic harness issue. This is not an additional product bug.

## Integration acceptance

The unchanged upstream bundle was verified in Home Assistant 2026.11.3, then deployed to Boat Assistant (integration PR https://github.com/tde01065/boat-assistant/pull/51). Initial rendering, repeated daily/hourly toggling, and final visual acceptance after removing the legacy resources passed. Alternative instrument sensor values and units were inspected: matching m/s units avoid the known mixed-source conversion bug. Source selection could not be uniquely demonstrated for wind speeds because the two sources rounded to the same integers. No external browser network requests were observed during dashboard loading; embedded SVGs appeared as data URLs. Upstream browser regression for offline animated icons passed. Full WAN-disconnected operation, narrow mobile layout and visual animation in the live integration were not independently verified.

The integration uses one native forecast toggle, temporary card-mod CSS for a compact layout, 60 px main icon with 45% opacity, and CSS-generated wind labels. These are requirements evidence, not a generic implementation prescription. Operational installation and recovery are documented in the consuming repository, not here. Both dashboards share the global custom-element resource; a separate dashboard is not version isolation.

## Next work

Read BACKLOG.md and ../AGENTS.md. Begin by designing a minimal FWC-11 fix and regression test; no feature implementation has started. Preserve this baseline as evidence, record new results separately, and use a new branch for each coherent change.
