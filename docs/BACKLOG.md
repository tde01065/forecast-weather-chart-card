# Development backlog

Status as of 2026-11-26. See BASELINE.md for measured evidence. Priorities and configuration shapes below are proposals, not approved contracts. P0 = data correctness; P1 = important reliability/build/UX; P2 = secondary improvements; P3 = polish. No fixes implemented yet. Start with FWC-11 to establish reproducible builds, then data correctness, reliability and presentation. Do not bundle unrelated fixes.

| ID | Priority | Status | Problem / acceptance direction |
|---|---|---|---|
| FWC-01 | P0 | Static defect identified | Alternative wind speed and gust sensors are read via readSensorState but converted using weather entity wind_speed_unit in renderAttributes. Carry source value and unit together, convert from actual source, test mixed units, separate speed/gust units and weather fallback. Forecasts use resolved forecast entity units. |
| FWC-02 | P0 | Static defect identified | Reject invalid, missing, nonfinite and unsupported values/units rather than coercing null/empty to zero or labeling unconverted values as target unit. Test unknown/unavailable, zero, malformed strings, unsupported units and supported Beaufort conversion (inverse approximate). Validate and normalize numeric wind bearings including wraparound. |
| FWC-03 | P0 | Design required | Explicit alternative-sensor fallback policy. Upstream falls back to weather data for absent/unavailable sensors; existing tests intentionally cover that behavior. Preserve default compatibility, allow strict sensor-only display so instrument data is not silently replaced by forecast/provider values. Define invalid-value and missing-unit semantics; consider source indication. |
| FWC-04 | P1 | Feature required | Separate conversion from presentation. Configurable current speed and gust precision (desired one decimal), forecast wind precision (desired integer), Beaufort integer. Preserve existing defaults; test both units and rounding boundaries. |
| FWC-05 | P1 | Static risk, reproduce first | Forecast type toggle may retain previous forecasts until first target payload; callbacks check type but not subscription identity. Test rapid toggles, delayed callbacks, entity changes and disconnect/reconnect. Ensure stale data never renders as another type/entity; define loading/cache behavior. |
| FWC-06 | P1 | Feature required | Optional compact responsive header layout, default unchanged. Desired main icon 60 px with configurable opacity, alignment with temperature top, near toggle, no wasted vertical space. Use layout rather than hard-coded offsets or private CSS overrides. Test narrow/wide widths, long translations, RTL, toggle hidden, clock and title variations. |
| FWC-07 | P2 | Feature required | Independent current, hourly and daily temperature precision. Existing forecast.round_temp also affects current. Preserve legacy configuration semantics when new options absent. |
| FWC-08 | P2 | Static risk, reproduce first | Verify Chart.js teardown on disconnect, cancellation of scheduled redraws and subscriptions, clock and resize lifecycle. drawChart destroys on redraw; missing canvas may schedule repeated requestAnimationFrame. Test detach/reconnect, hidden forecast and rapid config changes; fix only proven issues. |
| FWC-09 | P2 | Partial baseline PASS | Bundle already includes local animated icons; offline animated-icon browser test passed. Extend regression to full runtime rendering and toggling without external browser requests. Editor geocoding/timezone lookups may be optional online functions; distinguish editor from runtime. Do not claim weather-provider data is available offline. |
| FWC-10 | P3 | Feature required | Improve Swedish toggle labels (proposed Dygnsprognos / Timprognos) and cardinal directions (e.g. NE -> NO). Confirm terminology, preserve locale fallback and other languages. Check layout impact of longer labels. |
| FWC-11 | P1 | Confirmed, fix experiment PASS | Windows Rollup version substitution skips backslash module IDs. Normalize paths in rollup.version.mjs before /src/ check; add regression for POSIX and Windows IDs, non-src exclusion and version token substitution. Rebuild on Windows and Node 22 Linux and compare committed artifact bytes; avoid unrelated generated changes. |
| FWC-12 | P2 | Feature required | Optional per-attribute localized labels, especially Wind and Gust (Swedish Vind / Byvind). Render real DOM text, accessible and responsive, default off. Proposed attribute_labels mapping; agree on schema and editor UX before implementation. Test independent visibility and gust-only rendering (current outer wind group condition may omit gust when other fields hidden). |

## Technical debt / investigation

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
