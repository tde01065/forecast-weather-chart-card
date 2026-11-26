# Development backlog

Status as of 2026-11-26. See BASELINE.md for historical evidence and item entries below for subsequent verification. Priorities and configuration shapes below are proposals, not approved contracts. P0 = data correctness; P1 = important reliability/build/UX; P2 = secondary improvements; P3 = polish. Start with FWC-11 to establish reproducible builds, then data correctness, reliability and presentation. Do not bundle unrelated fixes.

| ID | Priority | Status | Problem / acceptance direction |
|---|---|---|---|
| FWC-01 | P0 | Partial | Independent wind source units and selected forecast entity unit are implemented; more fallback edge cases need verification. See subsequent work below. |
| FWC-02 | P0 | Partial | Wind speeds and bearings are validated; other measurements and Beaufort edge cases remain. See subsequent work below. |
| FWC-03 | P0 | Design required | Explicit alternative-sensor fallback policy. Upstream falls back to weather data for absent/unavailable sensors; existing tests intentionally cover that behavior. Preserve default compatibility, allow strict sensor-only display so instrument data is not silently replaced by forecast/provider values. Define invalid-value and missing-unit semantics; consider source indication. |
| FWC-04 | P1 | Feature required | Separate conversion from presentation. Configurable current speed and gust precision (desired one decimal), forecast wind precision (desired integer), Beaufort integer. Preserve existing defaults; test both units and rounding boundaries. |
| FWC-05 | P1 | Partial | Subscription identity and loading behavior fixed and tested; further asynchronous edge cases remain. See subsequent work below. |
| FWC-06 | P1 | Feature required | Optional compact responsive header layout, default unchanged. Desired main icon 60 px with configurable opacity, alignment with temperature top, near toggle, no wasted vertical space. Use layout rather than hard-coded offsets or private CSS overrides. Test narrow/wide widths, long translations, RTL, toggle hidden, clock and title variations. |
| FWC-07 | P2 | Feature required | Independent current, hourly and daily temperature precision. Existing forecast.round_temp also affects current. Preserve legacy configuration semantics when new options absent. |
| FWC-08 | P2 | Partial | Chart and subscription cleanup improved, with reconnect and hidden forecast tests; complete lifecycle coverage remains. See subsequent work below. |
| FWC-09 | P2 | Partial baseline PASS | Bundle already includes local animated icons; offline animated-icon browser test passed. Extend regression to full runtime rendering and toggling without external browser requests. Editor geocoding/timezone lookups may be optional online functions; distinguish editor from runtime. Do not claim weather-provider data is available offline. |
| FWC-10 | P3 | Partial | Swedish forecast labels and compass names corrected; layout testing for longer labels remains. |
| FWC-11 | P1 | Complete; merged and verified | Windows (Node 26.13.0, npm 11.20.0): regression reproduced before fix (Windows transform returned null; 1 failed, 5 passed); after path normalization, npm ci, npm run build, npm test (46/46) and npm run test:rtl (20/20) passed. Independent Linux validation in node:22-bookworm-slim (Debian 12, Node 22.23.4, npm 10.9.9): npm ci, npm run build, npm test (46/46) and npm run test:rtl (20/20) passed. Linux bundle is 580441 bytes, SHA-256 1B20E67A913A0173A6BBA9B880CC2A2515285B06D8F1E52D478BC6CE1D6238F7; byte-identical to the Windows bundle and historical upstream artifact. |
| FWC-12 | P2 | Partial | Gust-only rendering fixed and browser-tested; configurable labels and editor remain outstanding. |

## Technical debt / investigation

### Subsequent work on `feature/forecast-card-improvements`

- FWC-01 and FWC-02 remain partial: wind source units are tracked independently,
  invalid wind values are hidden, and numeric bearings wrap. Alternative
  sensor fallback for invalid values and measurement validation outside wind
  remain outstanding. Unsupported or absent wind units are displayed as
  reported rather than being presented as a converted unit.
- FWC-05 and FWC-08 remain partial: a regression reproduced stale daily data
  during an hourly switch. Subscriptions are identified by instance and
  entity; stale callbacks are ignored, data is cleared while loading, and
  charts, subscriptions, timers and pending resize/theme work are cleaned up
  on disconnect. More lifecycle and asynchronous edge cases need coverage.
- FWC-10 remains partial: Swedish forecast names and cardinal directions were
  corrected, but responsive testing of the longer labels remains outstanding.
- FWC-12 remains partial: gust-only rendering is fixed; configurable labels
  and their editor are not implemented.
- FWC-03, FWC-04, FWC-06, FWC-07 and the expanded FWC-09 offline scenarios
  remain unimplemented. This is not a completed backlog implementation.
- Validation of this partial branch: Windows Node 22.23.5 and Linux
  `node:22-bookworm-slim` Node 22.23.4 each passed `npm ci`, `npm run build`,
  50 unit tests and 21 browser tests. An earlier Windows browser run exposed a
  Chart.js canvas reuse error (20/21); chart cleanup was adjusted and the
  browser suite then passed twice on Windows and once on Linux. Both builds
  generated 583088 bytes with SHA-256
  `fd8309f1a7dfbe94f4e6b7a99cf898a1d5d62f3c5961c1574c668413e34529e0`.
  This evidence does not establish completion of the outstanding requirements.

- TD-01: npm ci reported deprecated inflight 1.0.6.
- TD-02: npm ci reported deprecated glob 7.2.3.
- TD-03: npm ci reported deprecated ESLint 9.39.5.
- TD-04: Node 22 MockTimers experimental warning. Investigate when relevant; avoid dependency churn in bug fixes.
- main.js is large and mixes state, conversion, subscription, chart and rendering concerns. Extract small pure functions when needed; no broad refactor for its own sake.
- Header uses config.title rather than hide_title in the inspected rendering. Confirm supported settings in defaults/editor/docs before adding any aliases.
- Keep integration-specific CSS and sensor IDs out of the generic component. Existing production CSS is a temporary workaround, not an API.
- Version-isolated test deployment is needed before testing a changed bundle alongside the production custom element. A separate dashboard alone does not isolate globally registered resources.

## Workflow

Each item needs a scoped design, acceptance criteria, regression evidence and review. Reproduce suspected defects before declaring them confirmed. Use separate coherent PRs, preserve backward compatibility, and offer generic fixes upstream. Record unresolved risks and test limits. Release and Boat Assistant deployment are separate decisions after validation.
