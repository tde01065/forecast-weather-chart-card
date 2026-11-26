"""Deterministic weather with real Home Assistant forecast subscriptions."""

from datetime import timedelta

from homeassistant.components.weather import WeatherEntity, WeatherEntityFeature
from homeassistant.const import UnitOfLength, UnitOfPressure, UnitOfSpeed, UnitOfTemperature
from homeassistant.util import dt as dt_util


async def async_setup_platform(hass, config, async_add_entities, discovery_info=None):
    """Create the local fixture weather entity."""
    async_add_entities([FixtureWeather()])


class FixtureWeather(WeatherEntity):
    """Static conditions and rolling timestamps, with no external data."""

    _attr_name = "Fixture Weather"
    _attr_unique_id = "forecast_card_fixture_weather"
    _attr_should_poll = False
    _attr_condition = "partlycloudy"
    _attr_native_temperature = 16.4
    _attr_native_temperature_unit = UnitOfTemperature.CELSIUS
    _attr_humidity = 70
    _attr_native_pressure = 1013.2
    _attr_native_pressure_unit = UnitOfPressure.HPA
    _attr_native_wind_speed = 14.4
    _attr_native_wind_gust_speed = 25.2
    _attr_native_wind_speed_unit = UnitOfSpeed.KILOMETERS_PER_HOUR
    _attr_wind_bearing = 225
    _attr_native_precipitation_unit = UnitOfLength.MILLIMETERS
    _attr_supported_features = (
        WeatherEntityFeature.FORECAST_DAILY | WeatherEntityFeature.FORECAST_HOURLY
    )

    async def async_forecast_daily(self):
        """Return a stable sequence with dates relative to today."""
        start = dt_util.utcnow().replace(hour=12, minute=0, second=0, microsecond=0)
        return [
            {
                "datetime": (start + timedelta(days=index)).isoformat(),
                "condition": ("partlycloudy", "rainy", "sunny")[index % 3],
                "native_temperature": 16.25 + index,
                "native_templow": 9.5 + index,
                "native_precipitation": 0.5 * (index % 3),
                "precipitation_probability": 20 + index * 5,
                "native_wind_speed": 14.4 + index,
                "wind_bearing": 225,
            }
            for index in range(7)
        ]

    async def async_forecast_hourly(self):
        """Return a stable sequence with timestamps relative to this hour."""
        start = dt_util.utcnow().replace(minute=0, second=0, microsecond=0)
        return [
            {
                "datetime": (start + timedelta(hours=index)).isoformat(),
                "condition": ("partlycloudy", "rainy", "sunny")[index % 3],
                "native_temperature": 14.25 + index / 4,
                "native_precipitation": 0.2 * (index % 3),
                "precipitation_probability": 20 + index,
                "native_wind_speed": 14.4 + index / 2,
                "wind_bearing": 225,
            }
            for index in range(24)
        ]
