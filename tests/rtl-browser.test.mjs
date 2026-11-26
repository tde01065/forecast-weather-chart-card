import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright';
import { startPreview } from '../scripts/preview.mjs';

const localeSource = readFileSync(new URL('../src/locale.js', import.meta.url), 'utf8');
const { default: locale } = await import('data:text/javascript;base64,' + Buffer.from(localeSource).toString('base64'));
const bundle = readFileSync(new URL('../dist/weather-chart-card-ha.js', import.meta.url), 'utf8');
let browser;
before(async () => {
  browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined) });
});
after(async () => { await browser?.close(); });

for (const { name, width } of [{ name: 'desktop', width: 1280 }, { name: 'narrow', width: 390 }]) {
  test(`HTTP preview renders and responds to controls: ${name}`, async () => {
    const server = await startPreview(0);
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(`page: ${error.message}`));
    page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
    page.on('requestfailed', request => errors.push(`request: ${request.url()} ${request.failure()?.errorText}`));
    page.on('response', response => {
      if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
    });
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/preview.html`);
      await page.waitForFunction(() => [...document.querySelectorAll('weather-chart-card-ha')].length === 2
        && [...document.querySelectorAll('weather-chart-card-ha')].every(card =>
          card.forecastChart && card.forecasts.length > 1 && card.shadowRoot?.querySelector('.current-temp')));
      for (const id of ['default', 'compact']) {
        const card = page.locator(`#${id}`);
        for (const selector of ['.current-temp', '.current-condition', '.weather-icon img', '.attributes', '.wind-speed-attribute', '#forecastChart']) {
          assert.equal(await card.locator(selector).isVisible(), true, `${id} ${selector} must be visible`);
        }
        assert.match((await card.locator('.current-temp').textContent()).trim(), /16\.4/);
        assert.ok((await card.locator('.current-condition').textContent()).trim());
        assert.ok(await card.locator('.weather-icon img').evaluate(image => image.complete && image.naturalWidth > 0));
        assert.ok(await card.evaluate(element => element.forecastChart.data.datasets[0].data.length > 0));
      }
      assert.equal(await page.locator('#compact .wind-speed-attribute').textContent(), '5.1 m/s');
      if (process.env.PREVIEW_SCREENSHOT_DIR) {
        await page.screenshot({ path: join(process.env.PREVIEW_SCREENSHOT_DIR, `preview-${name}.png`), fullPage: true });
      }
      for (const id of ['default', 'compact']) {
        await page.locator(`#${id} .forecast-toggle`).click();
        await page.waitForFunction(cardId => {
          const card = document.getElementById(cardId);
          return card.config.forecast.type === 'hourly' && card.forecastChart && card.forecasts.length > 1
            && Date.parse(card.forecasts[1].datetime) - Date.parse(card.forecasts[0].datetime) === 3600000;
        }, id);
        await page.locator(`#${id} .forecast-toggle`).click();
        await page.waitForFunction(cardId => {
          const card = document.getElementById(cardId);
          return card.config.forecast.type === 'daily' && card.forecastChart && card.forecasts.length > 1
            && Date.parse(card.forecasts[1].datetime) - Date.parse(card.forecasts[0].datetime) === 86400000;
        }, id);
      }
      await page.locator('#sensor').click();
      await page.waitForFunction(() => !document.querySelector('#compact').shadowRoot.querySelector('.wind-speed-attribute'));
      assert.equal(await page.locator('#compact .wind-gust-speed').textContent(), '7.5 m/s');
      assert.equal(await page.locator('#default .wind-speed-attribute').isVisible(), true);
      await page.locator('#sensor').click();
      await page.waitForFunction(() => document.querySelector('#compact').shadowRoot.querySelector('.wind-speed-attribute')?.textContent === '5.1 m/s');
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
      await new Promise((resolveClose, reject) => server.close(error => error ? reject(error) : resolveClose()));
    }
  });
}

for (const { width, language, title, clock, toggle } of [
  { width: 320, language: 'sv', title: '', clock: false, toggle: true },
  { width: 390, language: 'sv', title: 'En längre väderprognos för platsen', clock: true, toggle: false },
  { width: 320, language: 'he-IL', title: 'Weather', clock: true, toggle: true },
  { width: 1200, language: 'sv', title: 'Weather', clock: false, toggle: true },
]) {
  test(`offline compact integration: ${language}, ${width}, clock ${clock}, toggle ${toggle}`, async () => {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    const blocked = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.route('**/*', route => {
        if (route.request().url() === 'http://compact.test/') {
          return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><style>body{margin:0}ha-card,weather-chart-card-ha{display:block}</style></html>' });
        }
        blocked.push(route.request().url());
        return route.abort();
      });
      await page.goto('http://compact.test/');
      await page.addScriptTag({ content: bundle });
      await page.evaluate(({ language, title, clock, toggle }) => {
        document.documentElement.dir = language.startsWith('he') ? 'rtl' : 'ltr';
        const card = document.createElement('weather-chart-card-ha');
        const callbacks = {};
        card.setConfig({
          entity: 'weather.home', title, locale: language, compact: true, main_icon_size: 60,
          main_icon_opacity: 0.45, show_time: clock, show_day: clock, show_date: clock,
          show_forecast_toggle: toggle, show_wind_direction: false, show_wind_gust_speed: true,
          windspeed: 'sensor.speed', wind_gust_speed: 'sensor.gust',
          alternative_sensor_fallback: 'strict', units: { speed: 'm/s' },
          precision: { wind_speed: 1, wind_gust_speed: 1, temperature: 2 },
          attribute_labels: { wind_speed: 'Vind', wind_gust_speed: 'Byvind' },
          forecast: { disable_animation: true, precision: { wind_speed: 0, daily_temperature: 0, hourly_temperature: 1 } },
        });
        const hass = {
          language, config: { time_zone: 'UTC', unit_system: { temperature: '°C', length: 'km' } },
          states: {
            'weather.home': { state: 'sunny', attributes: { temperature: 12.345, temperature_unit: '°C', wind_speed: 99, wind_speed_unit: 'km/h', supported_features: 3 } },
            'sensor.speed': { state: '18.36', attributes: { unit_of_measurement: 'km/h' } },
            'sensor.gust': { state: '7.5', attributes: { unit_of_measurement: 'm/s' } },
          },
          connection: { subscribeMessage(callback, message) {
            callbacks[message.forecast_type] = callback;
            setTimeout(() => callback({ forecast: [{ datetime: '2026-10-18T12:00:00Z', temperature: 11.234, wind_speed: 18 }] }), 0);
            return Promise.resolve(() => {});
          } },
        };
        card.hass = hass;
        document.body.append(card);
        window.fixture = { card, hass, callbacks };
      }, { language, title, clock, toggle });
      await page.waitForFunction(() => window.fixture.card.forecastChart);
      const state = await page.evaluate(() => {
        const card = window.fixture.card;
        const root = card.shadowRoot;
        const icon = root.querySelector('.weather-icon');
        const temperature = root.querySelector('.current-temp');
        return {
          iconSize: icon.querySelector('img').getBoundingClientRect().width,
          opacity: getComputedStyle(icon).opacity,
          aligned: Math.abs(icon.getBoundingClientRect().top - temperature.getBoundingClientRect().top) < 2,
          temperature: temperature.textContent.trim(),
          labels: [...root.querySelectorAll('.attribute-label')].map(e => e.textContent.trim()),
          speed: root.querySelector('.wind-speed-attribute').textContent.trim(),
          gust: root.querySelector('.wind-gust-speed').textContent.trim(),
          forecastWind: root.querySelector('.wind-speed').textContent.trim(),
          chartValue: card.forecastChart.data.datasets[0].data[0],
          chartLabel: card.forecastChart.data.datasets[0].datalabels.formatter(11.234, { dataset: card.forecastChart.data.datasets[0], dataIndex: 0 }),
          overflow: document.documentElement.scrollWidth > innerWidth,
          iconSrc: icon.querySelector('img').src,
        };
      });
      assert.equal(state.iconSize, 60);
      assert.equal(state.opacity, '0.45');
      assert.equal(state.aligned, true);
      assert.equal(state.temperature, '12.35°C');
      assert.deepEqual(state.labels, ['Vind', 'Byvind']);
      const speedUnit = language.startsWith('he') ? locale.he.units['m/s'] : 'm/s';
      assert.equal(state.speed, '5.1 ' + speedUnit);
      assert.equal(state.gust, '7.5 ' + speedUnit);
      assert.equal(state.forecastWind, '5');
      assert.equal(state.chartValue, 11.234);
      assert.match(state.chartLabel, /11°/);
      assert.equal(state.overflow, false);
      assert.match(state.iconSrc, /^data:image\/svg\+xml,/);
      await page.evaluate(() => {
        const { card, hass } = window.fixture;
        hass.states['sensor.speed'].state = 'unavailable';
        card.hass = { ...hass };
      });
      await page.waitForFunction(() => !window.fixture.card.shadowRoot.querySelector('.wind-speed-attribute'));
      assert.equal(await page.locator('weather-chart-card-ha .wind-gust-speed').count(), 1);
      if (toggle) {
        await page.locator('weather-chart-card-ha .forecast-toggle').click();
        await page.waitForFunction(() => window.fixture.card.config.forecast.type === 'hourly' && window.fixture.card.forecastChart);
        const label = await page.evaluate(() => {
          const chart = window.fixture.card.forecastChart;
          return chart.data.datasets[0].datalabels.formatter(11.234, { dataset: chart.data.datasets[0], dataIndex: 0 });
        });
        assert.match(label, /11\.2°/);
      }
      assert.deepEqual(errors, []);
      assert.deepEqual(blocked, []);
    } finally { await page.close(); }
  });
}

test('wind source units and subscription identity survive switching and reconnect', async () => {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html></html>' }));
    await page.goto('http://wind.test/');
    await page.addScriptTag({ content: bundle });
    await page.evaluate(() => {
      const card = document.createElement('weather-chart-card-ha');
      window.subscriptions = [];
      card.setConfig({
        entity: 'weather.home', windspeed: 'sensor.speed', wind_gust_speed: 'sensor.gust',
        show_wind_direction: false, show_wind_speed: false, show_wind_gust_speed: true,
        show_sun: false, units: { speed: 'm/s' }, show_forecast_toggle: true,
        forecast: { hourly_entity: 'weather.hourly', disable_animation: true },
      });
      card.hass = {
        language: 'en', config: { time_zone: 'UTC', unit_system: { temperature: '°C' } },
        states: {
          'weather.home': { state: 'sunny', attributes: { temperature: 20, temperature_unit: '°C', wind_speed_unit: 'km/h', supported_features: 3 } },
          'weather.hourly': { state: 'sunny', attributes: { wind_speed_unit: 'mph', supported_features: 3 } },
          'sensor.speed': { state: '10', attributes: { unit_of_measurement: 'm/s' } },
          'sensor.gust': { state: '36', attributes: { unit_of_measurement: 'km/h' } },
        },
        connection: { subscribeMessage(callback, message) {
          const entry = { callback, message, closed: false };
          window.subscriptions.push(entry);
          return Promise.resolve(() => { entry.closed = true; });
        } },
      };
      document.body.append(card);
      window.card = card;
    });
    await page.waitForFunction(() => window.card.shadowRoot.querySelector('.wind-gust-speed'));
    assert.equal(await page.locator('weather-chart-card-ha').locator('.wind-gust-speed').textContent(), '10 m/s');
    await page.evaluate(() => window.subscriptions[0].callback({ forecast: [{ datetime: '2026-10-18T12:00:00Z', temperature: 20, wind_speed: 36 }] }));
    await page.waitForFunction(() => window.card.forecastChart);
    await page.evaluate(() => window.card.handleForecastTypeToggle());
    await page.waitForFunction(() => window.subscriptions.length === 2);
    assert.deepEqual(await page.evaluate(() => window.card.forecasts), []);
    await page.evaluate(() => {
      window.subscriptions[0].callback({ forecast: [{ temperature: 99 }] });
      window.subscriptions[1].callback({ forecast: [{ datetime: '2026-10-18T13:00:00Z', temperature: 18, wind_speed: 10 }] });
    });
    await page.waitForFunction(() => window.card.shadowRoot.querySelector('.wind-speed')?.textContent === '4');
    await page.evaluate(() => window.card.remove());
    assert.equal(await page.evaluate(() => window.card.forecastChart), null);
    await page.evaluate(() => document.body.append(window.card));
    await page.waitForFunction(() => window.subscriptions.length === 3);
    assert.deepEqual(await page.evaluate(() => window.card.forecasts), []);
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

test('disconnect cancels delayed observation, timers and chart across repeated reconnects', async () => {
  const page = await browser.newPage();
  try {
    await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html>' }));
    await page.goto('http://lifecycle.test/');
    await page.addScriptTag({ content: bundle });
    await page.evaluate(() => {
      window.observers = { active: 0, created: 0 };
      window.ResizeObserver = class {
        observe(element) {
          if (element.localName === 'ha-card') {
            this.card = true;
            window.observers.active++;
            window.observers.created++;
          }
        }
        disconnect() { if (this.card) window.observers.active--; }
      };
      const card = document.createElement('weather-chart-card-ha');
      card.setConfig({ entity: 'weather.home', show_time: true, autoscroll: true, forecast: { disable_animation: true } });
      card.hass = {
        language: 'en', config: { time_zone: 'UTC', unit_system: { temperature: '°C' } },
        states: { 'weather.home': { state: 'sunny', attributes: { temperature: 20, temperature_unit: '°C', supported_features: 3 } } },
        connection: { subscribeMessage(callback) {
          setTimeout(() => callback({ forecast: [{ datetime: new Date().toISOString(), temperature: 20 }] }), 0);
          return Promise.resolve(() => {});
        } },
      };
      document.body.append(card);
      card.remove();
      window.card = card;
    });
    await page.waitForTimeout(20);
    assert.equal(await page.evaluate(() => window.observers.active), 0);
    for (let i = 0; i < 2; i++) {
      await page.evaluate(() => document.body.append(window.card));
      await page.waitForFunction(() => window.card.forecastChart && window.observers.active === 1);
      if (i === 0) {
        await page.evaluate(() => {
          window.originalRaf = window.requestAnimationFrame;
          window.originalCancelRaf = window.cancelAnimationFrame;
          window.cancelledFrames = [];
          window.requestAnimationFrame = () => 8765;
          window.cancelAnimationFrame = id => window.cancelledFrames.push(id);
          window.card.hass = { ...window.card._hass, themes: { theme: 'dark', darkMode: true } };
        });
      }
      await page.evaluate(() => window.card.remove());
      const state = await page.evaluate(() => ({
        observers: window.observers.active,
        chart: window.card.forecastChart,
        clock: window.card.clockInterval,
        autoscroll: window.card.autoscrollTimeout,
        resize: window.card.resizeAttachTimeout,
      }));
      assert.deepEqual(state, { observers: 0, chart: null, clock: null, autoscroll: null, resize: null });
      if (i === 0) {
        const cancelled = await page.evaluate(() => {
          window.requestAnimationFrame = window.originalRaf;
          window.cancelAnimationFrame = window.originalCancelRaf;
          return window.cancelledFrames;
        });
        assert.ok(cancelled.includes(8765));
      }
    }
  } finally { await page.close(); }
});

test('chart labels and values follow changed forecast source units', async () => {
  const page = await browser.newPage();
  try {
    await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html></html>' }));
    await page.goto('http://forecast-units.test/');
    await page.addScriptTag({ content: bundle });
    await page.evaluate(() => {
      const card = document.createElement('weather-chart-card-ha');
      card.setConfig({ entity: 'weather.home', show_main: false,
        forecast: { daily_entity: 'weather.forecast', disable_animation: true } });
      const states = {
        'weather.home': { state: 'sunny', attributes: { temperature_unit: '°C', supported_features: 0 } },
        'weather.forecast': { state: 'sunny', attributes: { temperature_unit: '°F', precipitation_unit: 'mm', supported_features: 1 } },
      };
      const hass = { language: 'en', states, config: { time_zone: 'UTC', unit_system: { temperature: '°C', length: 'km' } },
        connection: { subscribeMessage(callback) {
          setTimeout(() => callback({ forecast: [{ datetime: '2026-10-18T12:00:00Z', temperature: 32, precipitation: 1 }] }), 0);
          return Promise.resolve(() => {});
        } } };
      card.hass = hass;
      document.body.append(card);
      window.fixture = { card, hass };
    });
    await page.waitForFunction(() => window.fixture.card.forecastChart);
    const result = await page.evaluate(() => {
      const { card, hass } = window.fixture;
      const read = () => {
        const chart = card.forecastChart;
        const label = chart.options.plugins.tooltip.callbacks.label;
        const temp = chart.data.datasets[0];
        const rain = chart.data.datasets[2];
        return {
          temperature: temp.data[0],
          tempLabel: label({ dataset: temp, datasetIndex: 0, dataIndex: 0, raw: temp.data[0] }),
          rainLabel: label({ dataset: rain, datasetIndex: 2, dataIndex: 0, formattedValue: '1' }),
        };
      };
      const before = read();
      const oldChart = card.forecastChart;
      hass.states['weather.forecast'] = { state: 'sunny',
        attributes: { temperature_unit: 'unknown', precipitation_unit: 'in', supported_features: 1 } };
      card.hass = { ...hass };
      return { before, after: read(), rebuilt: oldChart !== card.forecastChart };
    });
    assert.equal(result.before.temperature, 0);
    assert.match(result.before.tempLabel, /°C/);
    assert.match(result.before.rainLabel, /mm/);
    assert.equal(result.rebuilt, true);
    assert.equal(result.after.temperature, 32);
    assert.match(result.after.tempLabel, /unknown/);
    assert.match(result.after.rainLabel, /in/);
  } finally { await page.close(); }
});

for (const {name, forecast, expected} of [
  {name:'defaults', forecast:{}, expected:[[], [5, 5]]},
  {name:'solid', forecast:{temperature1_line_style:'solid', temperature2_line_style:'solid'}, expected:[[], []]},
  {name:'dashed', forecast:{temperature1_line_style:'dashed', temperature2_line_style:'dashed'}, expected:[[5, 5], [5, 5]]},
  {name:'independent', forecast:{temperature1_line_style:'dashed', temperature2_line_style:'solid'}, expected:[[5, 5], []]},
  {name:'invalid values', forecast:{temperature1_line_style:'unknown', temperature2_line_style:null}, expected:[[], [5, 5]]},
]) {
  test('temperature line styles: ' + name, async () => {
    const page = await browser.newPage();
    page.on('pageerror', error => console.error(error.message));
    try {
      await page.route('**/*', route => route.fulfill({contentType:'text/html', body:'<!doctype html><html></html>'}));
      await page.goto('http://line-style.test/');
      await page.addScriptTag({content:bundle});
      await page.evaluate(forecast => {
        const card = document.createElement('weather-chart-card-ha');
        card.setConfig({entity:'weather.home', show_main:false, forecast:{condition_icons:false, show_wind_forecast:false, disable_animation:true, ...forecast}});
        card.hass = {
          language:'en', config:{time_zone:'UTC', unit_system:{temperature:'°C'}},
          states:{'weather.home':{state:'sunny', last_changed:'2026-10-18T11:00:00Z', attributes:{temperature:20, temperature_unit:'°C', supported_features:3}}},
          connection:{subscribeMessage(callback) {
            setTimeout(() => callback({forecast:[{datetime:'2026-10-18T12:00:00Z', temperature:20, templow:10, precipitation:0}]}), 0);
            return Promise.resolve(() => {});
          }},
        };
        document.body.append(card);
        window.card = card;
      }, forecast);
      await page.waitForFunction(() => window.card.forecastChart);
      const actual = await page.evaluate(() => window.card.forecastChart.data.datasets.slice(0, 2).map(dataset => dataset.borderDash || []));
      assert.deepEqual(actual, expected);
    } finally { await page.close(); }
  });
}

for (const {name, forecast, expected} of [
  {name:'default', forecast:{}, expected:{display:'true', text:'0.4 mm', box:true}},
  {name:'compact', forecast:{compact_precipitation_labels:true}, expected:{display:'auto', text:'0.4', box:false}},
  {name:'compact keeps probability %', forecast:{compact_precipitation_labels:true, precipitation_type:'probability'}, expected:{display:'auto', text:'60 %', box:false}},
]) {
  test('compact precipitation labels: ' + name, async () => {
    const page = await browser.newPage();
    page.on('pageerror', error => console.error(error.message));
    try {
      await page.route('**/*', route => route.fulfill({contentType:'text/html', body:'<!doctype html><html></html>'}));
      await page.goto('http://precip-labels.test/');
      await page.addScriptTag({content:bundle});
      await page.evaluate(forecast => {
        const card = document.createElement('weather-chart-card-ha');
        card.setConfig({entity:'weather.home', show_main:false, forecast:{condition_icons:false, show_wind_forecast:false, disable_animation:true, ...forecast}});
        card.hass = {
          language:'en', config:{time_zone:'UTC', unit_system:{temperature:'°C', length:'km'}},
          states:{'weather.home':{state:'rainy', last_changed:'2026-10-18T11:00:00Z', attributes:{temperature:10, temperature_unit:'°C', precipitation_unit:'mm', supported_features:3}}},
          connection:{subscribeMessage(callback) {
            setTimeout(() => callback({forecast:[{datetime:'2026-10-18T12:00:00Z', temperature:10, templow:5, precipitation:0.4, precipitation_probability:60}]}), 0);
            return Promise.resolve(() => {});
          }},
        };
        document.body.append(card);
        window.card = card;
      }, forecast);
      await page.waitForFunction(() => window.card.forecastChart);
      const actual = await page.evaluate(() => {
        const dataset = window.card.forecastChart.data.datasets[2];
        const context = {dataset, dataIndex:0};
        const labels = dataset.datalabels;
        return {
          display: labels.display(context),
          text: labels.formatter(dataset.data[0], context),
          box: labels.backgroundColor !== 'transparent',
        };
      });
      assert.deepEqual(actual, expected);
    } finally { await page.close(); }
  });
}

for (const {name, config, expected} of [
  {name:'shown by default, in the flow', config:{}, expected:{shown:true, position:'static'}},
  {name:'hidden with show_version: false', config:{show_version:false}, expected:{shown:false, position:null}},
]) {
  test('card version: ' + name, async () => {
    const page = await browser.newPage();
    page.on('pageerror', error => console.error(error.message));
    try {
      await page.route('**/*', route => route.fulfill({contentType:'text/html', body:'<!doctype html><html></html>'}));
      await page.goto('http://card-version.test/');
      await page.addScriptTag({content:bundle});
      await page.evaluate(config => {
        const card = document.createElement('weather-chart-card-ha');
        card.setConfig({entity:'weather.home', show_main:false, forecast:{condition_icons:false, show_wind_forecast:false, disable_animation:true}, ...config});
        card.hass = {
          language:'en', config:{time_zone:'UTC', unit_system:{temperature:'°C'}},
          states:{'weather.home':{state:'sunny', last_changed:'2026-10-18T11:00:00Z', attributes:{temperature:20, temperature_unit:'°C', supported_features:3}}},
          connection:{subscribeMessage(callback) {
            setTimeout(() => callback({forecast:[{datetime:'2026-10-18T12:00:00Z', temperature:20, templow:10, precipitation:0}]}), 0);
            return Promise.resolve(() => {});
          }},
        };
        document.body.append(card);
        window.card = card;
      }, config);
      await page.waitForFunction(() => window.card.forecastChart);
      const actual = await page.evaluate(() => {
        const element = window.card.shadowRoot.querySelector('.card-version');
        return {shown: !!element, position: element ? getComputedStyle(element).position : null};
      });
      assert.deepEqual(actual, expected);
    } finally { await page.close(); }
  });
}

test('Hebrew covers every existing translation and unit, including Auto', () => {
  for (const key of Object.keys(locale.en)) assert.ok(locale.he[key], key);
  for (const key of Object.keys(locale.en.units)) assert.ok(locale.he.units[key], key);
  for (const strings of Object.values(locale)) {
    assert.ok(strings.daily);
    assert.ok(strings.hourly);
    assert.ok(strings.auto);
  }
});

for (const width of [390, 1200]) {
  for (const language of ['en', 'he-IL', 'zh-Hant']) {
    test('shipped card: ' + language + ', width ' + width, async () => {
      const direction = language.startsWith('he') ? 'rtl' : 'ltr';
      const strings = locale[language] || locale[language.split('-')[0]];
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      const errors = [];
      page.on('pageerror', error => { errors.push(error.message); console.error('Browser error:', error.message); });
      try {
        await page.clock.setFixedTime(new Date('2026-10-18T12:00:00Z'));
        await page.route('**/*', route => {
          const path = new URL(route.request().url()).pathname;
          if (path === '/card.js') return route.fulfill({ contentType:'text/javascript', body:bundle });
          if (path === '/') return route.fulfill({ contentType:'text/html', body:'<!doctype html><html dir="' + direction + '" style="--direction:' + direction + '"><meta charset="utf-8"><style>body{margin:0}weather-chart-card-ha{display:block;max-width:600px;margin:auto}ha-card{display:block;background:#fff}</style><script src="/card.js"></script></html>' });
          return route.abort();
        });
        await page.goto('http://rtl.test/');
        await page.evaluate(({ language }) => {
          const card = document.createElement('weather-chart-card-ha');
          const forecasts = Array.from({length:5}, (_, i) => ({
            datetime: new Date(Date.UTC(2026, 9, 18 + i, 12)).toISOString(),
            temperature: 24, templow: 17, condition: 'sunny', precipitation: 2.5,
            precipitation_probability: 65, wind_speed: 15, wind_bearing: 90,
          }));
          const hass = {
            language, config: { time_zone:'UTC', unit_system:{ temperature:'\u00b0C', length:'km', wind_speed:'km/h', pressure:'hPa' } },
            states: { 'weather.home': { state:'sunny', last_changed:'2026-10-18T11:00:00Z', attributes:{
              temperature:-3, temperature_unit:'\u00b0C', humidity:65,
              pressure:1000, pressure_unit:'hPa', dew_point:-5, uv_index:4.2,
              visibility:10, visibility_unit:'km', wind_speed:15,
              wind_speed_unit:'km/h', wind_gust_speed:30, wind_bearing:90, supported_features:3,
            } } },
            connection: { subscribeMessage(callback) {
              setTimeout(() => callback({forecast:forecasts}), 0);
              return Promise.resolve(() => {});
            } },
          };
          card.setConfig({
            entity:'weather.home', title:'Weather', animated_icons:false,
            show_time:true, show_day:true, show_date:true, show_forecast_toggle:true,
            show_dew_point:true, show_visibility:true, show_wind_gust_speed:true, show_sun:false,
            units:{temperature:'\u00b0F', pressure:'mmHg', speed:'mph', visibility:'mi'},
            forecast:{condition_icons:false, disable_animation:true, show_probability:true},
          });
          card.hass = hass;
          document.body.append(card);
          window.fixture = {card, hass};
        }, {language});
        await page.waitForFunction(() => window.fixture.card.forecastChart, null, {timeout:10000});
        const result = await page.evaluate(() => {
          const card = window.fixture.card;
          card.updateClock();
          const root = card.shadowRoot;
          const rain = card.forecastChart.data.datasets[2];
          const directions = Object.fromEntries(['current-temp', 'water-percent', 'pressure', 'dew-point', 'visibility', 'uv-index', 'wind-speed-attribute', 'wind-gust-speed', 'attributes', 'chart-container', 'date-text'].map(name => [name, getComputedStyle(root.querySelector('.' + name)).direction]));
          const text = name => root.querySelector('.' + name).textContent.trim();
          return {
            directions, day:card.getLocalizedDayName(new Date('2026-10-18T12:00:00Z'), 'UTC'),
            zonedDay:card.getLocalizedDayName(new Date('2026-10-18T23:30:00Z'), 'Asia/Jerusalem'),
            date:root.querySelector('.date-text.date').textContent,
            humidity:text('water-percent'), pressure:text('pressure'), dewPoint:text('dew-point'),
            wind:text('wind-speed-attribute'), gust:text('wind-gust-speed'), visibility:text('visibility'),
            rainLabel:rain.datalabels.formatter(2.5, {dataset:rain, dataIndex:0}),
            overflow:document.documentElement.scrollWidth > innerWidth,
          };
        });
        for (const [name, actual] of Object.entries(result.directions)) {
          assert.equal(actual, ['attributes', 'date-text'].includes(name) ? direction : 'ltr', name);
        }
        const weekday = direction === 'rtl' ? 'long' : 'short';
        const formatDay = (date, timeZone) => new Intl.DateTimeFormat(language, {weekday, timeZone}).format(new Date(date)).replace(/[.\s]+$/u, '');
        const expectedDay = formatDay('2026-10-18T12:00:00Z', 'UTC');
        assert.equal(result.day, direction === 'rtl' ? expectedDay : expectedDay.toLocaleUpperCase(language));
        const zonedDay = formatDay('2026-10-18T23:30:00Z', 'Asia/Jerusalem');
        assert.equal(result.zonedDay, direction === 'rtl' ? zonedDay : zonedDay.toLocaleUpperCase(language));
        assert.equal(result.date, new Intl.DateTimeFormat(language, {day:'numeric', month:'long', timeZone:'UTC'}).format(new Date('2026-10-18T12:00:00Z')));
        assert.equal(result.humidity, '65 %');
        assert.equal(result.pressure, '750 ' + strings.units.mmHg);
        assert.equal(result.dewPoint, '23 \u00b0F');
        assert.equal(result.wind, '9 ' + strings.units.mph);
        assert.equal(result.gust, '19 ' + strings.units.mph);
        assert.equal(result.visibility, '6.2 mi');
        assert.equal(result.overflow, false);
        const lines = result.rainLabel.split('\n');
        assert.ok(lines.includes(''), 'preserve blank line between rain and probability');
        for (const line of lines.filter(Boolean)) {
          if (direction === 'rtl') assert.match(line, /^\u202B.*\u202C$/);
          else assert.doesNotMatch(line, /[\u202B\u202C]/);
        }
        const toggle = page.locator('weather-chart-card-ha .forecast-toggle');
        assert.equal((await toggle.textContent()).trim(), strings.hourly);
        await toggle.click();
        await page.waitForFunction(() => window.fixture.card.config.forecast.type === 'hourly');
        assert.equal((await toggle.textContent()).trim(), strings.daily);
        await toggle.click();
        await page.waitForFunction(() => window.fixture.card.config.forecast.type === 'daily');
        assert.equal((await toggle.textContent()).trim(), strings.hourly);
        if (direction === 'rtl') {
          const fallback = await page.evaluate(() => {
            const card = window.fixture.card;
            card.config.locale = 'he-invalid!'; // Force Intl to use the translation fallback.
            return card.getLocalizedDayName(new Date('2026-10-18T12:00:00Z'), 'UTC');
          });
          assert.equal(fallback, strings.days[0]);
        }
        await page.evaluate(async () => {
          const card = window.fixture.card;
          card.config = {...card.config, locale:undefined, show_main:false};
          await card.updateComplete;
        });
        assert.equal(await page.locator('weather-chart-card-ha .attributes').count(), 0);
        assert.equal(await toggle.count(), 1);
        await page.evaluate(async () => {
          const card = window.fixture.card;
          card.config = {...card.config, forecast:{...card.config.forecast, auto_rotate:10}};
          await card.updateComplete;
        });
        // Auto-rotate keeps the manual label and button, marked with an icon.
        assert.equal((await toggle.textContent()).trim(), strings.hourly);
        assert.equal(await toggle.isDisabled(), false);
        assert.equal(await toggle.getAttribute('title'), strings.auto);
        assert.equal(await page.locator('weather-chart-card-ha .forecast-toggle .auto-rotate-icon').count(), 1);
        await toggle.click();
        await page.waitForFunction(() => window.fixture.card.config.forecast.type === 'hourly');
        assert.equal((await toggle.textContent()).trim(), strings.daily);
        assert.deepEqual(errors, []);
      } finally { await page.close(); }
    });
  }
}

test('animated icons render from the bundle with the network blocked', async () => {
  const page = await browser.newPage({ viewport: { width: 600, height: 844 } });
  const errors = [];
  const blocked = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.route('**/*', route => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/card.js') return route.fulfill({ contentType:'text/javascript', body:bundle });
      if (path === '/') return route.fulfill({ contentType:'text/html', body:'<!doctype html><html><meta charset="utf-8"><style>ha-card{display:block}</style><script src="/card.js"></script></html>' });
      blocked.push(route.request().url());
      return route.abort();
    });
    await page.goto('http://icons.test/');
    await page.evaluate(() => {
      const forecasts = Array.from({length:5}, (_, i) => ({
        datetime: new Date(Date.UTC(2026, 9, 18 + i, 12)).toISOString(),
        temperature: 20, templow: 10, condition: ['sunny', 'rainy', 'cloudy', 'snowy', 'fog'][i],
      }));
      const card = document.createElement('weather-chart-card-ha');
      card.setConfig({ entity:'weather.home', icon_style:'style2' });
      card.hass = {
        language:'en', config:{ time_zone:'UTC', unit_system:{ temperature:'°C', length:'km' } },
        states:{ 'weather.home':{ state:'sunny', last_changed:'2026-10-18T11:00:00Z', attributes:{ temperature:20, temperature_unit:'°C', supported_features:3 } } },
        connection:{ subscribeMessage(callback) { setTimeout(() => callback({forecast:forecasts}), 0); return Promise.resolve(() => {}); } },
      };
      document.body.append(card);
      window.card = card;
    });
    await page.waitForFunction(() => window.card.shadowRoot.querySelectorAll('.forecast-item img').length === 5, null, {timeout:10000});
    await page.waitForFunction(() => [...window.card.shadowRoot.querySelectorAll('img')].every(img => img.complete));
    const icons = await page.evaluate(() => [...window.card.shadowRoot.querySelectorAll('img')]
      .map(img => ({ scheme:img.src.split(':')[0], width:img.naturalWidth })));
    assert.equal(icons.length, 6);
    for (const icon of icons) {
      assert.equal(icon.scheme, 'data');
      assert.ok(icon.width > 0, 'icon decoded');
    }
    assert.deepEqual(blocked, []);
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

test('chart overlays render and gestures fire hass-action', async () => {
  const page = await browser.newPage({ viewport: { width: 600, height: 844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.clock.setFixedTime(new Date('2026-06-21T12:00:00Z'));
    await page.route('**/*', route => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/card.js') return route.fulfill({ contentType:'text/javascript', body:bundle });
      if (path === '/') return route.fulfill({ contentType:'text/html', body:'<!doctype html><html><meta charset="utf-8"><style>ha-card{display:block;background:#fff}</style><script src="/card.js"></script></html>' });
      return route.abort();
    });
    await page.goto('http://overlays.test/');
    await page.evaluate(() => {
      const hourly = Array.from({length:24}, (_, i) => ({
        datetime: new Date(Date.UTC(2026, 5, 21, 12 + i)).toISOString(),
        temperature: 15 + 5 * Math.sin(i / 4), condition: 'rainy', precipitation: (i % 3) * 0.5, precipitation_probability: (i * 13) % 100,
      }));
      const daily = Array.from({length:5}, (_, i) => ({
        datetime: new Date(Date.UTC(2026, 5, 21 + i, 12)).toISOString(),
        temperature: 24 + i, templow: i === 0 ? undefined : 14 + i, condition: 'sunny', precipitation: 1,
      }));
      const card = document.createElement('weather-chart-card-ha');
      card.setConfig({
        entity:'weather.home', animated_icons:false, sun_latitude:51.5, sun_longitude:0, sun_timezone:'Europe/London',
        tap_action:{ action:'more-info' }, hold_action:{ action:'navigate', navigation_path:'/radar' },
        forecast:{ type:'hourly', number_of_forecasts:24, disable_animation:true, night_shading:true, show_probability_line:true, fill_temperature_range:true },
      });
      card.hass = {
        language:'en', config:{ time_zone:'Europe/London', unit_system:{ temperature:'°C', length:'km' } },
        states:{ 'weather.home':{ state:'rainy', last_changed:'2026-06-21T11:00:00Z', attributes:{ temperature:15, temperature_unit:'°C', supported_features:3 } } },
        connection:{ subscribeMessage(callback, message) {
          setTimeout(() => callback({ forecast: message.forecast_type === 'hourly' ? hourly : daily }), 0);
          return Promise.resolve(() => {});
        } },
      };
      window.actions = [];
      card.addEventListener('hass-action', (e) => window.actions.push(e.detail.action));
      document.body.append(card);
      window.card = card;
    });
    await page.waitForFunction(() => window.card.forecastChart, null, {timeout:10000});
    const hourly = await page.evaluate(() => {
      const chart = window.card.forecastChart;
      // Count the night columns the plugin paints: sample the canvas at the top of each column.
      const ctx = chart.canvas.getContext('2d', { willReadFrequently: true });
      const ratio = chart.currentDevicePixelRatio;
      const shaded = chart.data.labels.map((_, i) => {
        const x = Math.round(chart.scales.x.getPixelForValue(i) * ratio);
        // Any pixel of the bare night band colour, rgba(100, 120, 160, 0.15), in the
        // column; lines, labels and bars cover parts of it.
        const { top, bottom } = chart.chartArea;
        const column = ctx.getImageData(x, Math.round(top * ratio), 1, Math.round((bottom - top) * ratio)).data;
        for (let p = 0; p < column.length; p += 4) {
          const [r, g, b, a] = column.slice(p, p + 4);
          if (Math.abs(r - 100) < 4 && Math.abs(g - 120) < 4 && Math.abs(b - 160) < 4 && Math.abs(a - 38) < 3) return true;
        }
        return false;
      });
      return { datasets: chart.data.datasets.length, probability: chart.data.datasets[3].data.slice(0, 3), shaded };
    });
    if (process.env.WCC_SCREENSHOT) await page.screenshot({ path: process.env.WCC_SCREENSHOT.replace('.png', '-hourly.png') });
    assert.equal(hourly.datasets, 4);
    assert.deepEqual(hourly.probability, [0, 13, 26]);
    // Slots start at 13:00 BST; London sunset is 21:21 and sunrise 04:43 BST, so 22:00 to 04:00 are night.
    assert.deepEqual(hourly.shaded.map(Number).join(''), '000000000111111100000000');

    // Tap and hold on the current conditions, with real pointer events.
    const current = page.locator('weather-chart-card-ha .current');
    assert.equal(await current.getAttribute('role'), 'button');
    assert.equal(await page.locator('weather-chart-card-ha .chart-container').getAttribute('aria-label'), 'Forecast: Hourly');
    await current.click();
    const box = await current.boundingBox();
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.down();
    await page.waitForTimeout(700);
    await page.mouse.up();
    await page.waitForFunction(() => window.actions.length >= 2);
    assert.deepEqual(await page.evaluate(() => window.actions), ['tap', 'hold']);

    // Daily view: range fill, with a gap where the first day has no low.
    await page.evaluate(() => window.card.handleForecastTypeToggle());
    await page.waitForFunction(() => window.card.forecastChart.data.labels.length === 5);
    const daily = await page.evaluate(() => {
      const chart = window.card.forecastChart;
      return { lows: chart.data.datasets[1].data, fill: chart.getDatasetMeta(0).dataset.options.fill };
    });
    assert.deepEqual(daily.lows, [null, 15, 16, 17, 18]);
    assert.equal(daily.fill.target, 1);
    assert.ok(daily.fill.above, 'fill colour resolved');
    await page.screenshot({ path: process.env.WCC_SCREENSHOT || '/dev/null' }).catch(() => {});
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

test('editor choices render without Home Assistant components and update the config', async () => {
  const page = await browser.newPage({ viewport: { width: 600, height: 1600 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.route('**/*', route => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/card.js') return route.fulfill({ contentType:'text/javascript', body:bundle });
      if (path === '/') return route.fulfill({ contentType:'text/html', body:'<!doctype html><meta charset="utf-8"><script src="/card.js"></script>' });
      return route.abort();
    });

    await page.goto('http://editor.test/');
    // No ha-radio, ha-checkbox or ha-switch is defined here, as in a dashboard
    // where Home Assistant has not loaded them.
    const result = await page.evaluate(async () => {
      const editor = document.createElement('weather-chart-card-ha-editor');
      editor.hass = { states: { 'weather.home': { state: 'sunny', attributes: {} } }, config: {}, language: 'en' };
      editor.setConfig({ entity: 'weather.home' });
      const changes = [];
      editor.addEventListener('config-changed', (e) => changes.push(e.detail.config));
      document.body.append(editor);
      await editor.updateComplete;
      const root = editor.shadowRoot;
      const ids = ['forecast-type', 'chart-style', 'icon-style'];
      // Pages are toggled by class; show them all to measure every select.
      root.querySelectorAll('.page-container').forEach(p => p.classList.add('active'));
      const shown = {};
      for (const id of ids) {
        const select = root.getElementById(id);
        shown[id] = { width: select.getBoundingClientRect().width, value: select.value, options: select.options.length };
      }
      const icon = root.getElementById('icon-style');
      icon.value = 'style3';
      icon.dispatchEvent(new Event('change'));
      const chart = root.getElementById('chart-style');
      chart.value = 'style1';
      chart.dispatchEvent(new Event('change'));
      const checkboxes = root.querySelectorAll('input.native-checkbox').length;
      return { shown, last: changes.at(-1), first: changes[0], checkboxes };
    });
    for (const [id, select] of Object.entries(result.shown)) assert.ok(select.width > 50, `${id} is visible`);
    assert.deepEqual(result.shown['icon-style'], { ...result.shown['icon-style'], value: 'style1', options: 3 });
    assert.equal(result.shown['forecast-type'].value, 'daily');
    assert.equal(result.first.icon_style, 'style3');
    assert.equal(result.last.forecast.style, 'style1');
    assert.equal(result.checkboxes, 4);
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

test('editor exposes strict fallback and independent precision controls', async () => {
  const page = await browser.newPage();
  try {
    await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html>' }));
    await page.goto('http://editor-options.test/');
    await page.addScriptTag({ content: bundle });
    const result = await page.evaluate(async () => {
      const editor = document.createElement('weather-chart-card-ha-editor');
      editor.hass = { states: { 'weather.home': { state: 'sunny', attributes: {} } }, config: {}, language: 'en' };
      editor.setConfig({ entity: 'weather.home' });
      let config;
      editor.addEventListener('config-changed', e => { config = e.detail.config; });
      document.body.append(editor);
      await editor.updateComplete;
      const root = editor.shadowRoot;
      const fallback = root.querySelector('#alternative-fallback');
      fallback.value = 'strict';
      fallback.dispatchEvent(new Event('change'));
      const strict = config.alternative_sensor_fallback;
      const precision = root.querySelector('select[aria-label="Current wind speed precision"]');
      precision.value = '1';
      precision.dispatchEvent(new Event('change'));
      const speedPrecision = config.precision.wind_speed;
      const label = root.querySelector('ha-textfield[label="Wind gust label (optional)"]');
      label.value = 'Byvind';
      label.dispatchEvent(new Event('change'));
      return { strict, precision: speedPrecision, label: config.attribute_labels.wind_gust_speed, count: root.querySelectorAll('select[aria-label$="precision"]').length };
    });
    assert.deepEqual(result, { strict: 'strict', precision: 1, label: 'Byvind', count: 6 });
  } finally { await page.close(); }
});

test('editor reconnect resubscribes and rejects the detached probe', async () => {
  const page = await browser.newPage();
  try {
    await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html>' }));
    await page.goto('http://editor-reconnect.test/');
    await page.addScriptTag({ content: bundle });
    const result = await page.evaluate(async () => {
      const callbacks = [];
      let closed = 0;
      const editor = document.createElement('weather-chart-card-ha-editor');
      editor.hass = { states: { 'weather.home': { state: 'sunny', attributes: {} } },
        connection: { subscribeMessage(callback) {
          callbacks.push(callback);
          return Promise.resolve(() => { closed++; });
        } } };
      editor.setConfig({ entity: 'weather.home' });
      document.body.append(editor);
      await editor.updateComplete;
      editor.remove();
      editor._probeProbability();
      callbacks[0]({ forecast: [{ precipitation_probability: 0 }] });
      const detached = { count: callbacks.length, value: editor._hasProbability };
      document.body.append(editor);
      await editor.updateComplete;
      callbacks[0]({ forecast: [{ precipitation_probability: 0 }] });
      callbacks[1]({ forecast: [{}] });
      await Promise.resolve();
      return { detached, count: callbacks.length, value: editor._hasProbability, closed };
    });
    assert.deepEqual(result, { detached: { count: 1, value: undefined }, count: 2, value: false, closed: 2 });
  } finally { await page.close(); }
});
