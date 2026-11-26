// Resolve each reading together with its own source unit before formatting.
export function resolveCurrentMeasurements(card, hass, attributes) {
  const config = card.config;
  const read = (entity, value, unit) => ({
    value: card.readSensorState(hass, entity, value),
    unit: card.sensorSuppliesValue(hass, entity)
      ? hass.states[entity].attributes?.unit_of_measurement : unit,
  });
  const temperature = read(config.temp, attributes.temperature, attributes.temperature_unit);
  const pressure = read(config.press, attributes.pressure, attributes.pressure_unit);
  const dewPoint = read(config.dew_point, attributes.dew_point, attributes.temperature_unit);
  const feelsLike = read(config.feels_like, attributes.apparent_temperature, attributes.temperature_unit);
  const visibility = read(config.visibility, attributes.visibility, attributes.visibility_unit);
  const speed = card.readWindMeasurement(hass, config.windspeed, attributes.wind_speed, attributes.wind_speed_unit);
  const gust = card.readWindMeasurement(hass, config.wind_gust_speed, attributes.wind_gust_speed, attributes.wind_speed_unit);

  return {
    temperature: temperature.value, temperatureSourceUnit: temperature.unit,
    humidity: card.readSensorState(hass, config.humid, attributes.humidity),
    pressure: pressure.value, pressureSourceUnit: pressure.unit,
    uv_index: card.readSensorState(hass, config.uv, attributes.uv_index),
    windSpeed: speed.value, windSpeedSourceUnit: speed.unit,
    dew_point: dewPoint.value, dewPointSourceUnit: dewPoint.unit,
    wind_gust_speed: gust.value, windGustSourceUnit: gust.unit,
    visibility: visibility.value, visibilitySourceUnit: visibility.unit,
    windDirection: card.readSensorState(hass, config.winddir, attributes.wind_bearing, true),
    feels_like: feelsLike.value, feelsLikeSourceUnit: feelsLike.unit,
    description: card.readDescription(hass, attributes.description),
  };
}

export function resolveDescription(card, hass, fallback) {
  const { description, description_attribute: attribute, entity, alternative_sensor_fallback: policy } = card.config;
  const fallbackValue = description && policy === 'strict' ? undefined : fallback;
  if (description && !card.hasSensorState(hass, description)) return fallbackValue;
  const id = description || (attribute ? entity : undefined);
  const state = id ? hass.states[id] : undefined;
  const value = attribute ? state?.attributes?.[attribute] : state?.state;
  if (value === undefined || value === null || String(value).trim() === '') return fallbackValue;
  if (!attribute) return value;
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}
