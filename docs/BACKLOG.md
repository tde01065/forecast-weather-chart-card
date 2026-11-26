# Development backlog

See BASELINE.md for historical evidence. This branch integrates the remaining items for practical evaluation; release and deployment remain separate decisions. P0 = data correctness; P1 = important reliability/build/UX; P2 = secondary improvements; P3 = polish.

| ID | Priority | Status | Problem / acceptance direction |
|---|---|---|---|
| FWC-01 | P0 | Complete | Independently track speed and gust sensor units and the selected forecast entity unit; mixed units, fallback and switching tested. |
| FWC-02 | P0 | Complete | Numeric validation, zero handling, unit provenance and normalized bearings; unsupported units remain unconverted. Beaufort inverse is approximate. |
| FWC-03 | P0 | Complete | Default weather fallback and opt-in strict policy, with editor and invalid-sensor tests. Missing/unsupported units do not trigger fallback. |
| FWC-04 | P1 | Complete | Independent current speed, gust and forecast wind precision; conversion precedes rounding and Beaufort remains integer. |
| FWC-05 | P1 | Complete | Subscription identity, loading, rotation, stale callbacks, connection replacement and delayed unsubscribe covered by automated tests. |
| FWC-06 | P1 | Implemented; visual acceptance pending | Optional responsive compact layout and icon opacity; browser coverage includes 320–1200 px, Swedish, RTL, title, clock and toggle variations. Final visual acceptance requires the real HA frontend. |
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

### Consolidated review, 2026-11-26

- Measurement parsing and conversion and the editor stylesheet were separated
  into cohesive modules. Local CodeScene 1.0.58 against master reports
  `main.js` 1.84 -> 1.68 (previously 1.58) and the editor 4.53 -> 4.74
  (previously 4.47). The main file still regresses: its rendering, forecast
  lifecycle and configuration methods remain large and complex. Avoiding a
  broad, behavior-risking rewrite leaves those findings open. The editor probe
  also remains complex after lifecycle hardening. The new measurement module
  scores 8.67 and has pressure/conditional complexity findings; the generated
  bundle and test code have additional delta findings.
- A forecast entity changing units could leave old chart labels and conversion
  assumptions in a reused chart. The chart now rebuilds when source or display
  units change, including when both source units map to the same display unit.
  Unsupported pressure units matching inherited object names now remain
  unconverted. Regression tests include unchanged-unit negative controls.
- Editor probability probes now identify the connection and individual
  subscription, reject stale events, and release delayed or synchronous
  subscriptions. Unsupported forecast requests and cleanup failures are logged.
- Coverage review: FWC-01/02/03 cover independent wind sources, invalid and
  zero readings, unit provenance and both fallback policies; FWC-04/07 cover
  independent precision, conversion before rounding and legacy options;
  FWC-05/08 cover subscription identity, stale callbacks, delayed cleanup,
  timers, chart destruction and reconnect; FWC-06/10/12 cover responsive
  layouts, Swedish labels and separate gust/speed labels; FWC-09 covers
  bundled icons with external requests blocked; FWC-11 covers both path
  formats and cross-platform builds. The mocked browser fixture is not a
  substitute for manual visual acceptance in Home Assistant.
- `tests/ha` provides an isolated local HA instance. Its weather entity uses
  real forecast subscriptions and the controls simulate sensor recovery.
  The YAML acceptance view and a user-created UI-managed editor playground share
  the isolated instance, not a production custom-element registration. An
  automated HA browser run loaded all three cards, switched forecast type, and
  checked fallback, strict policy, recovery, icon settings and editor controls.
  One frontend `unknown_command` unhandled rejection occurred before the
  editor was added; its source is not yet identified. A subsequent run,
  including independent speed and gust failure/recovery, saw no page errors.
- Windows Node 26.13.0 and Ubuntu 24.04 container Node 22.20.0: build, 61 unit
  tests and 31 browser tests passed on each. Linux used `npm ci`; Windows used
  the existing installed dependencies. Bundles were byte-identical with SHA-256
  `ae78a70275bbb317e3c56e1f1b2a68322c4a7e875b6fcd75fae44937f2b4b643`.

### Compact layout follow-up, 2026-11-26

- FWC-06 remains **visual acceptance pending**. The compact title and forecast
  toggle share a row; without a title the toggle shares the conditions row.
  The icon aligns with the temperature, attributes no longer wrap prematurely,
  and the default layout and chart sizing are unchanged. Compact icons scale
  down when necessary. The toggle no longer triggers a current-conditions tap
  action when nested in a titleless compact card.
- Real HA 2026.11.3, Swedish, static 60 px icon, identical fixture data: header
  height is measured from the card top to the chart top, in pixels.

  | Width | Variant | Before | After |
  | --- | --- | ---: | ---: |
  | 320 | Default, title | 229.4 | 229.4 |
  | 320 | Compact, title | 315.4 | 195.4 |
  | 320 | Default, no title | 194.0 | 194.0 |
  | 320 | Compact, no title | 258.6 | 188.2 |
  | 600 | Default, title | 229.4 | 229.4 |
  | 600 | Compact, title | 263.4 | 195.4 |
  | 600 | Default, no title | 194.0 | 194.0 |
  | 600 | Compact, no title | 206.6 | 166.6 |

  Charts stayed 180 px high and the same width for matched cards. The existing
  default titleless layout overlaps its condition and icon at 320 px; it was
  not changed because preserving that layout was required. Compact controls
  were checked for overlap; browser regressions also cover RTL, long labels,
  clock/date, hidden toggle and both icon types.
- The dedicated comparison view is responsive: all four card widths measured
  384 px at a 1440 px viewport and 374 px at a 390 px viewport. Separate views
  retain fallback/recovery, precision and static/animated checks. Real HA
  automation exercised forecast switching and independent sensor failures and
  recovery. All chart canvases contained rendered non-white pixels. One
  frontend rejection was reported as `Object`; the earlier fixture run saw
  `unknown_command`. Whether these share a cause is unknown.
- The component stylesheet and current measurement/description resolution
  were extracted. Local CodeScene 1.0.58 against master reports `main.js`
  1.84 -> 1.88 (previous branch result 1.68), and editor 4.53 -> 4.74.
  Individual degraded complexity findings remain in rendering, configuration,
  subscriptions and editor probing; the stylesheet has a large-method finding,
  and description resolution remains complex. No findings were suppressed.
- Windows Node 26.13.0 and Ubuntu 24.04 container Node 22.20.0 passed
  `npm run build`, `npm test` (62/62) and `npm run test:rtl` (35/35).
  Linux used `npm ci`; Windows used existing dependencies. Both independently
  built bundles had SHA-256
  `f303bfcd0a090d58e69187e55fd1ab2ae350b685242368876c1084d4b7895d38`.

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
