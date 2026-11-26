# Changelog

## Unreleased

### Added
- An isolated Docker Compose Home Assistant test instance with deterministic weather, sensor-failure controls and acceptance dashboards.
- Optional compact layout and main icon opacity, independent wind and temperature precision, and optional wind and gust text labels, with editor controls.
- `alternative_sensor_fallback: strict` prevents invalid or unavailable configured sensors from being substituted with weather entity data.
- A bundled, mock-data `preview.html` compares the default and compact layouts without Home Assistant.
- `last_changed_source`: pick which Home Assistant timestamp the "last changed" line shows: `changed` (default, the condition changed), `updated` (any attribute changed too) or `reported` (HA last received a value). The editor shows it as three radio buttons under the switch.
- `forecast.compact_precipitation_labels`: precipitation values without the box and the rainfall unit, hiding values that would overlap. For many hourly forecasts on a narrow screen (#73). The values keep a 2px gap below the bars.
- `description_attribute`: show an attribute as the description, e.g. `content` from an OpenWeatherMap summary sensor, without a template sensor (#61). The description wraps and stops at three lines.
- `show_version`: hide the card version in the bottom corner (default `true`, shown as before).

### Fixed
- Compact headers place the title and toggle together, align the weather icon with current conditions, and avoid the extra vertical row and attribute wrapping.
- Default headers wrap current conditions when needed to prevent the centered icon from overlapping them.
- Forecast charts rebuild when their source or display units change, keeping converted values and tooltip labels consistent.
- Editor forecast probes reject stale callbacks after connection replacement and clean up even when the first event arrives synchronously.
- Unsupported pressure units that happen to match JavaScript object property names remain unconverted.
- The standalone preview uses one timestamp per forecast, avoiding inconsistent interval lengths in its smoke test.
- The local preview now has a dedicated localhost server that serves the correct bundle with a JavaScript content type and reports occupied ports. Browser smoke tests exercise real HTTP responses rather than intercepted fixtures.
- Invalid or missing measurements no longer become zero; alternative temperature, pressure and visibility readings retain their own source units. Forecast chart calculations retain temperature precision.
- Forecast subscriptions reject callbacks from replaced connections and handle delayed cleanup; detached cards no longer restart their clock or chart work.
- Current wind speed and gust use their own sensor units; forecast wind uses its forecast entity's unit. Values with unknown or missing units are not relabelled as converted values, and invalid wind speeds are hidden.
- Old forecast subscription callbacks no longer replace the selected forecast after switching or reconfiguration. Closing a card destroys its chart and subscriptions and cancels pending resize and theme redraw work.
- Swedish forecast labels and compass directions use Swedish terminology. A gust can be displayed on its own.
- The card version was drawn on top of the card's last row (wind, condition icons or the last-changed line) and could cover it. It now has its own line below the content.
- Sunrise and sunset came from the card's own approximation even for the Home Assistant home location, so they could differ by a minute or so from `sun.sun` and the rest of Home Assistant. Without a custom card location the card now shows `sun.sun`'s times; its own calculation is kept for a custom location, or when `sun.sun` is missing or unavailable.
- With a custom card location but no `sun.sun` entity, sunrise and sunset were hidden. They are now calculated.
- A weather entity without a valid `last_changed` timestamp made the whole card fail to render, even with `show_last_changed` off.
- The editor's precipitation probability switches looked broken when the forecast has no `precipitation_probability`: they changed nothing on the chart. They are now greyed out with a note in that case.

## 1.10.0

### Added
- `tap_action`, `hold_action` and `double_tap_action` on the current conditions and the chart, with every standard Home Assistant action.
- `forecast.night_shading`: shade sunset to sunrise on the hourly chart.
- `forecast.fill_temperature_range`: shade between the high and low lines.
- `forecast.show_probability_line`: precipitation probability as a line over the rainfall bars.
- Editor switches for the three chart options.
- `icon_style: style3`: the amCharts animated weather icons (CC BY 4.0), bundled like the other two sets.
- `forecast.wind_warning`: colour the wind forecast by Beaufort force (#57).

### Changed
- The animated icons are bundled inside the card. They no longer come from a CDN, so they work offline and always match the installed version.
- Condition names use Home Assistant's own translations when the card shows Home Assistant's language.
- `forecast.round_temp` also rounds the current temperature and feels like (11.3 → 11, 11.6 → 12).
- The bundle is minified: 789 KB before, 473 KB now (118 KB gzipped), icons included.

### Fixed
- On RTL dashboards the temperature gradient of the high line ran in the wrong direction.
- Without coordinates, the `sun.sun` fallback marked every hourly slot as night during the day.
- The editor's forecast type, chart style and icon style choices, and the clock checkboxes, showed only their labels: Home Assistant does not always load `ha-radio` and `ha-checkbox` for card editors. They are now native dropdowns and checkboxes.
- A feels-like temperature of exactly 0° was hidden.
- A forecast day without a low temperature shifted every later low one column left; a missing low was drawn as 0.

### Development
- ESLint 9 flat config, `@rollup/plugin-node-resolve`, terser, Node 22 in CI.
- CI runs `npm audit`, the unit tests, and checks that the committed `dist/` matches the source.

## 1.9.0
- Auto-rotate takes minutes plus seconds (`auto_rotate`, `auto_rotate_seconds`); the daily/hourly button stays clickable and restarts the timer.

## 1.8.0
- Fixed 18 bugs from the 2026-10-21 audit (autoscroll, timezone-aware day and month names, column alignment with autoscroll, unavailable sensors, editor defaults, resize after view changes, Norwegian, units on first load, theme colors, precipitation units, pressure units, and more).
- The card shows its version.
- Since 1.7.4: `forecast.extra_rows`, `forecast.highlight_today`, RTL fixes, Traditional Chinese.
