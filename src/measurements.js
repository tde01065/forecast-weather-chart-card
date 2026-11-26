// Values and units are kept together at display time; an unknown source unit
// cannot safely be converted to the configured target unit.
export function measurementNumber(value) {
  if (typeof value !== 'number' && (typeof value !== 'string'
      || !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim()))) {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function numericBearing(value) {
  const number = measurementNumber(value);
  return number === null ? null : ((number % 360) + 360) % 360;
}

export function convertTemperature(temp, fromUnit, toUnit) {
  if (toUnit === '°C' && fromUnit === '°F') return (temp - 32) * 5 / 9;
  if (toUnit === '°F' && fromUnit === '°C') return (temp * 9 / 5) + 32;
  return temp;
}

export function formatPressure(value, fromUnit, toUnit = fromUnit) {
  const numericValue = Number(value);
  if (value === undefined || value === null || value === '' || !Number.isFinite(numericValue)) {
    return { value, unit: toUnit || fromUnit };
  }
  const toPascals = {
    'Pa': 1, 'hPa': 100, 'mbar': 100, 'cbar': 1000, 'kPa': 1000,
    'bar': 100000, 'mmHg': 133.322387415, 'inHg': 3386.389, 'psi': 6894.757,
  };
  const decimals = { 'kPa': 1, 'cbar': 1, 'bar': 3, 'inHg': 2, 'psi': 2 };
  const fromFactor = Object.hasOwn(toPascals, fromUnit) ? toPascals[fromUnit] : undefined;
  const toFactor = Object.hasOwn(toPascals, toUnit) ? toPascals[toUnit] : undefined;
  const unit = fromFactor && toFactor ? toUnit : fromUnit;
  const converted = fromFactor && toFactor ? numericValue * fromFactor / toFactor : numericValue;
  const places = Object.hasOwn(decimals, unit) ? decimals[unit] : 0;
  return { value: places ? converted.toFixed(places) : Math.round(converted), unit };
}

export function convertVisibility(value, fromUnit, toUnit) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return value;
  if (!fromUnit || !toUnit || fromUnit === toUnit) return numericValue;
  const toMeters = { 'm': 1, 'km': 1000, 'mi': 1609.344, 'yd': 0.9144, 'ft': 0.3048 };
  const fromFactor = toMeters[fromUnit];
  const toFactor = toMeters[toUnit];
  if (!fromFactor || !toFactor) return numericValue;
  return Math.round(numericValue * fromFactor / toFactor * 10) / 10;
}
