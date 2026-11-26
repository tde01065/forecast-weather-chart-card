# Isolated Home Assistant acceptance environment

This Docker Compose project runs Home Assistant Container 2026.11.3 on
`http://127.0.0.1:8124`. It uses a dedicated Docker volume and localhost-only
port publishing. The Docker network allows outbound traffic; it does
not use the production Home Assistant configuration, credentials, integrations
or entities. The test-only integration supplies deterministic conditions and
daily/hourly forecasts through Home Assistant's weather subscription API.
Forecast timestamps advance with the clock; values are deterministic.
Home Assistant's local recorder stores its test database in the dedicated volume.

From the repository root in PowerShell, with Docker Desktop running:

```powershell
npm run build
docker compose -f tests\ha\compose.yaml up -d
```

Open [the test dashboard](http://127.0.0.1:8124/lovelace/acceptance). On first
use, complete Home Assistant onboarding and create a **new local test account**;
do not reuse production credentials or configure production integrations. Home
Assistant's onboarding may automatically attempt to set up online services;
the fixture itself does not depend on them. The dashboard
has controls for speed and gust sensor failure and recovery. The fallback and
strict cards should react independently. Use the card button to switch
forecasts.

The first view compares identical default and compact cards with and without
titles. Separate views cover fallback/recovery, precision, and static versus
animated icons. The acceptance dashboard is YAML-managed. To exercise the visual editor,
create a separate UI-managed dashboard in **Settings > Dashboards**, add a
Weather Chart Card there, and select `weather.fixture_weather`. This is still
the same isolated test instance. The shared card resource is already configured.

To update the card, run `npm run build` again and hard-refresh the browser.
The whole `dist` directory is mounted read-only, so container rebuilds are not
needed. HA and browser caches may require a hard refresh. When sharing an
updated fixture with existing browser sessions, change the resource query
string in `configuration.yaml` to the new bundle hash prefix and restart this
test container to make the browser request the new resource.

```powershell
docker compose -f tests\ha\compose.yaml stop
docker compose -f tests\ha\compose.yaml up -d
```

To **erase all test users and state** and repeat onboarding, run:

```powershell
docker compose -f tests\ha\compose.yaml down --volumes
```

Only the Compose project's `forecast-card-test_ha-state` volume is removed.
The test data, custom integration, and dashboard configuration are tracked;
runtime data and credentials remain in the Docker volume, not Git. To use
another available port, set `$env:HA_TEST_PORT = '8125'` before Compose
commands and change the URL accordingly. If Docker Desktop's port 8124 is
already occupied, choose a different port rather than stopping another service.
