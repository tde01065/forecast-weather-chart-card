import { html } from 'lit';

export function renderCardStyles(config) {
  const forecastOnly = config.show_main === false;
  const iconOpacity = typeof config.main_icon_opacity === 'number' && Number.isFinite(config.main_icon_opacity)
    && config.main_icon_opacity >= 0 && config.main_icon_opacity <= 1 ? config.main_icon_opacity : 1;
  return html`
      <style>
        ha-card {
          ${config.title ? 'padding-bottom: 8px;' : ''}
          position: relative;
          overflow: hidden;
        }
        ha-icon {
          color: var(--paper-item-icon-color);
        }
        img {
          width: ${config.icons_size}px;
          height: ${config.icons_size}px;
        }
        .card {
          padding-top: ${config.title ? '0px' : '16px'};
          padding-right: 16px;
          padding-bottom: ${config.show_last_changed === true ? '2px' : '16px'};
          padding-left: 16px;
        }
        .main {
          display: flex;
          align-items: ${config.title ? 'center' : 'flex-start'};
          justify-content: space-between;
          font-size: ${config.current_temp_size}px;
          margin-bottom: 10px;
          position: ${config.title ? 'relative' : 'static'};
          ${config.title ? '' : `min-height: ${59 + (parseInt(config.main_icon_size, 10) || 150) / 2}px;`}
        }
        .main .weather-icon {
          position: absolute;
          left: 50%;
          top: ${config.title ? '10px' : '75px'};
          transform: translate(-50%, -50%);
          z-index: 1;
          opacity: ${iconOpacity};
        }
        .main .weather-icon ha-icon {
          --mdc-icon-size: ${config.main_icon_size || 150}px;
        }
        .main .weather-icon img {
          width: ${config.main_icon_size || 150}px;
          height: ${config.main_icon_size || 150}px;
        }
        .main .temp-info {
          display: flex;
          flex-direction: column;
          z-index: 2;
        }
        .card:not(.compact) .main .temp-info {
          max-width: max(0px, calc((100% - ${config.main_icon_size || 150}px) / 2));
          overflow-wrap: anywhere;
        }
        .main .temp-info > div {
          line-height: 1.2;
        }
        .main .current-temp {
          font-size: ${config.current_temp_size}px;
          font-weight: 300;
          direction: ltr;
          unicode-bidi: isolate;
        }
        .main .current-condition {
          font-size: 18px;
          margin-top: 4px;
        }
        .current-time {
          position: absolute;
          top: 24px;
          right: 16px;
          inset-inline-start: initial;
          inset-inline-end: 16px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          z-index: 1;
          font-size: ${config.time_size}px;
        }
        .date-text {
          font-size: ${config.day_date_size}px;
          color: var(--secondary-text-color);
          direction: var(--direction, inherit);
        }
        .main span {
          font-size: 18px;
          color: var(--secondary-text-color);
        }
        .attributes {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          font-weight: 300;
        }
        .chart-container {
          position: relative;
          height: ${config.forecast.chart_height}px;
          width: 100%;
          direction: ltr;
          margin-top: ${forecastOnly && config.show_forecast_toggle ? '40px' : '0px'};
        }
        .conditions {
          display: flex;
          justify-content: space-around;
          align-items: center;
          margin: 0px 5px 0px 5px;
          cursor: pointer;
        }
        .forecast-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 1px;
        }
        .extra-row {
          display: flex;
          justify-content: space-around;
          align-items: center;
          margin: 0px 5px;
          font-weight: 300;
          cursor: pointer;
        }
        .extra-detail {
          display: flex;
          flex: 1 1 0;
          justify-content: center;
          align-items: center;
          margin: 1px;
          min-width: 0;
        }
        .extra-detail ha-icon {
          --mdc-icon-size: 15px;
          margin-inline-end: 1px;
        }
        .extra-value {
          font-size: 11px;
        }
        .extra-unit {
          font-size: 9px;
          margin-inline-start: 1px;
        }
        .wind-details {
          display: flex;
          justify-content: space-around;
          align-items: center;
          font-weight: 300;
        }
        .wind-detail {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 1px;
        }
        .wind-main {
          display: flex;
          align-items: center;
        }
        .wind-details.with-direction {
          margin-top: ${config.forecast.condition_icons === false ? '0px' : '-4px'};
        }
        .wind-dir-label {
          font-size: 9px;
          line-height: 10px;
          opacity: 0.7;
          white-space: nowrap;
        }
        .wind-detail ha-icon {
          --mdc-icon-size: 15px;
          margin-right: 1px;
          margin-inline-start: initial;
          margin-inline-end: 1px;
        }
        .wind-icon {
          margin-right: 1px;
          margin-inline-start: initial;
          margin-inline-end: 1px;
          position: relative;
          bottom: 1px;
        }
        .wind-speed {
          font-size: 11px;
          margin-right: 1px;
          margin-inline-start: initial;
          margin-inline-end: 1px;
        }
        .wind-unit {
          font-size: 9px;
          margin-left: 1px;
          margin-inline-start: 1px;
          margin-inline-end: initial;
        }
        .main .feels-like {
          font-size: 13px;
          margin-top: 5px;
          font-weight: 400;
        }
        .main .description {
          font-style: italic;
          font-size: 13px;
          margin-top: 5px;
          font-weight: 400;
          /* Summary attributes can be whole sentences: wrap, and stop at three lines. */
          overflow-wrap: anywhere;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
          line-clamp: 3;
          overflow: hidden;
        }
        .card-version {
          /* In the flow, not absolute: an overlay covered the last row (wind, icons). */
          padding: 0 6px 2px;
          text-align: right; /* physical, not end: bottom-right in RTL too */
          font-size: 9px;
          line-height: 1;
          color: var(--secondary-text-color);
          opacity: 0.6;
          pointer-events: none;
        }
        .updated {
          font-size: 13px;
          align-items: right;
          font-weight: 300;
          margin-bottom: 1px;
        }
        .forecast-toggle {
          cursor: pointer;
          background: var(--primary-color);
          color: var(--text-primary-color);
          border: none;
          border-radius: 4px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 700;
          opacity: 0.9;
          transition: opacity 0.2s;
          margin-top: 4px;
        }
        .forecast-toggle:hover {
          opacity: 1;
        }
        .attributes .water-percent,
        .attributes .pressure,
        .attributes .dew-point,
        .attributes .visibility,
        .attributes .uv-index,
        .attributes .wind-speed-attribute,
        .attributes .wind-gust-speed {
          direction: ltr;
          unicode-bidi: isolate;
        }
        .forecast-toggle {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .forecast-toggle .auto-rotate-icon {
          --mdc-icon-size: 14px;
          color: inherit;
        }
        .card.compact {
          container-type: inline-size;
          padding-top: ${config.title ? '12px' : '16px'};
        }
        .card.compact .current-time {
          position: static;
          flex-direction: row;
          justify-content: flex-end;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px 8px;
          font-size: ${config.time_size}px;
        }
        .card.compact .compact-header {
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .card.compact .compact-title {
          order: 0;
          flex: 1 1 100px;
          min-width: 0;
          overflow-wrap: anywhere;
          font-size: 24px;
          line-height: 1.2;
        }
        .card.compact .compact-header .forecast-toggle {
          order: 1;
        }
        .card.compact .compact-header #digital-clock,
        .card.compact .compact-header .date-text {
          order: 2;
        }
        .card.compact .compact-controls {
          flex: 0 0 auto;
          max-width: 45%;
          min-width: 0;
        }
        .card.compact .forecast-toggle {
          margin-top: 0;
        }
        .card.compact .main {
          position: static;
          min-height: 0;
          align-items: flex-start;
          justify-content: space-between;
          gap: 4px;
          margin-bottom: 4px;
        }
        .card.compact .temp-info {
          flex: 1 1 auto;
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .card.compact .weather-icon {
          position: static;
          transform: none;
          flex: 0 0 min(${config.main_icon_size || 150}px, 24cqw);
        }
        .card.compact .weather-icon ha-icon {
          --mdc-icon-size: min(${config.main_icon_size || 150}px, 24cqw);
        }
        .card.compact .weather-icon img {
          width: 100%;
          height: auto;
        }
        .card.compact .attributes {
          flex-wrap: wrap;
        }
        .card.compact .attributes > div {
          max-width: 100%;
          overflow-wrap: anywhere;
        }
        .card.compact .chart-container {
          margin-top: ${forecastOnly && config.show_forecast_toggle ? '4px' : '0px'};
        }
        .actionable {
          cursor: pointer;
          -webkit-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
        }
        .actionable:focus-visible {
          outline: 2px solid var(--primary-color);
          outline-offset: 2px;
        }
      </style>
  `;
}
