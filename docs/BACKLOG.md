# Development backlog

See BASELINE.md for historical evidence. This branch integrates the remaining items for practical evaluation; release and deployment remain separate decisions. P0 = data correctness; P1 = important reliability/build/UX; P2 = secondary improvements; P3 = polish.

| ID | Priority | Status | Problem / acceptance direction |
|---|---|---|---|
| FWC-01 | P0 | Complete | Independently track speed and gust sensor units and the selected forecast entity unit; mixed units, fallback and switching tested. |
| FWC-02 | P0 | Complete | Numeric validation, zero handling, unit provenance and normalized bearings; unsupported units remain unconverted. Beaufort inverse is approximate. |
| FWC-03 | P0 | Complete | Default weather fallback and opt-in strict policy, with editor and invalid-sensor tests. Missing/unsupported units do not trigger fallback. |
| FWC-04 | P1 | Complete | Independent current speed, gust and forecast wind precision; conversion precedes rounding and Beaufort remains integer. |
| FWC-05 | P1 | Complete | Subscription identity, loading, rotation, stale callbacks, connection replacement and delayed unsubscribe covered by automated tests. |
| FWC-06 | P1 | Complete | Optional responsive compact layout and icon opacity; browser coverage includes 320–1200 px, Swedish, RTL, title, clock and toggle variations. |
| FWC-07 | P2 | Complete | Independent current/hourly/daily temperature precision overrides legacy round_temp per reading; chart calculations retain precision. |
| FWC-08 | P2 | Complete | Chart, subscription, timers, redraw frame and resize cleanup tested across hide, detach and reconnect. |
| FWC-09 | P2 | Complete | Browser integration exercises bundled runtime with external requests blocked; online editor lookups and fresh provider data still require connectivity. |
| FWC-10 | P3 | Complete | Swedish forecast and compass names corrected; longer labels tested in compact layouts. |
| FWC-11 | P1 | Complete; merged and verified | Windows (Node 26.13.0, npm 11.20.0): regression reproduced before fix (Windows transform returned null; 1 failed, 5 passed); after path normalization, npm ci, npm run build, npm test (46/46) and npm run test:rtl (20/20) passed. Independent Linux validation in node:22-bookworm-slim (Debian 12, Node 22.23.4, npm 10.9.9): npm ci, npm run build, npm test (46/46) and npm run test:rtl (20/20) passed. Linux bundle is 580441 bytes, SHA-256 1B20E67A913A0173A6BBA9B880CC2A2515285B06D8F1E52D478BC6CE1D6238F7; byte-identical to the Windows bundle and historical upstream artifact. |
| FWC-12 | P2 | Complete | Independent optional wind and gust DOM text labels, editor controls and gust-only browser coverage. |

## Technical debt / investigation

### Subsequent work on `feature/forecast-card-improvements`

- A regression reproduced stale daily data during an hourly switch; a later
  lifecycle regression reproduced a clock interval restarting after detach.
  Both are covered by automated tests. The browser fixture uses mock Home
  Assistant data; real installations and all device sizes are not covered.
- Validation of the initial partial commit: Windows Node 22.23.5 and Linux
  `node:22-bookworm-slim` Node 22.23.4 each passed `npm ci`, `npm run build`,
  50 unit tests and 21 browser tests. An earlier Windows browser run exposed a
  Chart.js canvas reuse error (20/21); chart cleanup was adjusted and the
  browser suite then passed twice on Windows and once on Linux. Both builds
  generated 583088 bytes with SHA-256
  `fd8309f1a7dfbe94f4e6b7a99cf898a1d5d62f3c5961c1574c668413e34529e0`.
  This evidence applies only to that partial commit.

- Integrated validation: Windows Node 22.23.5 and isolated Linux
  `node:22-bookworm-slim` Node 22.23.4 passed `npm ci`, `npm run build`,
  57 unit tests and 28 browser tests each. Windows also passed a separate
  Chromium run. Both bundles were byte-identical: 589632 bytes, SHA-256
  `77f6f5df38e073ca7c6e6a7e3121247db333d7820634343b3e0058a14dce96e0`.
- Local CodeScene delta analysis reports increased complexity in the already
  large main card and editor, plus misleading findings on the generated,
  minified bundle. These remain maintenance risks; no findings were suppressed.

- TD-01: npm ci reported deprecated inflight 1.0.6.
- TD-02: npm ci reported deprecated glob 7.2.3.
- TD-03: npm ci reported deprecated ESLint 9.39.5.
- TD-04: Node 22 MockTimers experimental warning. Investigate when relevant; avoid dependency churn in bug fixes.
- main.js is large and mixes state, conversion, subscription, chart and rendering concerns. Extract small pure functions when needed; no broad refactor for its own sake.
- Header uses config.title rather than hide_title in the inspected rendering. Confirm supported settings in defaults/editor/docs before adding any aliases.
- Keep integration-specific CSS and sensor IDs out of the generic component. Existing production CSS is a temporary workaround, not an API.
- Version-isolated test deployment is needed before testing a changed bundle alongside the production custom element. A separate dashboard alone does not isolate globally registered resources.

## Workflow

Future items need scoped design, regression evidence and review. Preserve backward compatibility and record unresolved risks and test limits. Release and deployment are separate decisions after validation.
