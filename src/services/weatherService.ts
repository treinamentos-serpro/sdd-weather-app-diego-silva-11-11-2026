import type { City, CurrentWeather, ForecastDay, WeatherData } from '../types/weather';

type WeatherServiceErrorCode = 'timeout' | 'network' | 'http' | 'invalid-response';

export class WeatherServiceError extends Error {
  constructor(
    message: string,
    readonly code: WeatherServiceErrorCode,
  ) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 10_000;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (isRecord(error) && error.name === 'AbortError') {
      throw new WeatherServiceError('A requisição demorou demais.', 'timeout');
    }
    throw new WeatherServiceError('Falha de rede.', 'network');
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new WeatherServiceError('Não foi possível consultar o Open-Meteo.', 'http');
  }

  try {
    return await response.json();
  } catch {
    throw new WeatherServiceError('A resposta do Open-Meteo é inválida.', 'invalid-response');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function boundedNumber(value: unknown, min: number, max: number): number | null {
  const number = finiteNumber(value);
  return number !== null && number >= min && number <= max ? number : null;
}

function nonNegativeNumber(value: unknown): number | null {
  return boundedNumber(value, 0, Number.MAX_VALUE);
}

function weatherCode(value: unknown): number | null {
  const code = finiteNumber(value);
  return code !== null && code >= 0 && code <= 99 && Number.isInteger(code) ? code : null;
}

function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isConsecutiveDates(dates: string[]): boolean {
  return dates.every((date, index) => {
    if (index === 0) return true;
    const previous = new Date(`${dates[index - 1]}T00:00:00Z`);
    previous.setUTCDate(previous.getUTCDate() + 1);
    return previous.toISOString().slice(0, 10) === date;
  });
}

function dateInTimezone(timezone: string): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function mapCity(value: unknown): City | null {
  if (!isRecord(value)) return null;
  const { id, name, latitude, longitude } = value;
  const validLatitude = boundedNumber(latitude, -90, 90);
  const validLongitude = boundedNumber(longitude, -180, 180);
  if (
    typeof id !== 'number' ||
    !Number.isInteger(id) ||
    id <= 0 ||
    typeof name !== 'string' ||
    !name.trim() ||
    validLatitude === null ||
    validLongitude === null
  ) {
    return null;
  }

  return {
    id,
    name,
    admin1: typeof value.admin1 === 'string' ? value.admin1 : null,
    country: typeof value.country === 'string' ? value.country : null,
    latitude: validLatitude,
    longitude: validLongitude,
  };
}

export async function searchCities(name: string): Promise<City[]> {
  const trimmedName = name.trim();
  if (!trimmedName) return [];

  const url = new URL(GEOCODING_URL);
  url.search = new URLSearchParams({
    name: trimmedName,
    count: '5',
    language: 'pt',
  }).toString();

  const payload = await fetchJson(url.toString());
  if (!isRecord(payload)) {
    throw new WeatherServiceError('A resposta do Open-Meteo é inválida.', 'invalid-response');
  }
  if (payload.results === undefined || payload.results === null) return [];
  if (!Array.isArray(payload.results)) {
    throw new WeatherServiceError('A resposta do Open-Meteo é inválida.', 'invalid-response');
  }

  return payload.results
    .slice(0, 5)
    .map(mapCity)
    .filter((city): city is City => city !== null);
}

function mapObservedAt(value: unknown, utcOffsetSeconds: number | null): string | null {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) return null;
  if (/(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) return value;
  if (utcOffsetSeconds === null) return null;
  return new Date(Date.parse(`${value}Z`) - utcOffsetSeconds * 1_000).toISOString();
}

function mapCurrent(
  value: Record<string, unknown>,
  utcOffsetSeconds: number | null,
): CurrentWeather {
  const humidity = boundedNumber(value.relative_humidity_2m, 0, 100);
  return {
    temperatureC: finiteNumber(value.temperature_2m),
    weatherCode: weatherCode(value.weather_code),
    observedAt: mapObservedAt(value.time, utcOffsetSeconds),
    humidityPercent: humidity,
    windSpeedKmh: nonNegativeNumber(value.wind_speed_10m),
    precipitationMm: nonNegativeNumber(value.precipitation),
    pressureHpa: nonNegativeNumber(value.pressure_msl),
  };
}

function mapForecast(
  daily: Record<string, unknown>,
  timezone: string | null,
): ForecastDay[] | null {
  const times = daily.time;
  if (
    !timezone ||
    !Array.isArray(times) ||
    times.length < 5 ||
    !times.slice(0, 5).every(validDate)
  ) {
    return null;
  }

  const dates = times.slice(0, 5);
  if (!dates.every((date): date is string => typeof date === 'string')) return null;
  if (dates[0] !== dateInTimezone(timezone) || !isConsecutiveDates(dates)) return null;
  const weatherCodes = Array.isArray(daily.weather_code) ? daily.weather_code : [];
  const minimums = Array.isArray(daily.temperature_2m_min) ? daily.temperature_2m_min : [];
  const maximums = Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max : [];
  const precipitation = Array.isArray(daily.precipitation_probability_max)
    ? daily.precipitation_probability_max
    : [];

  return dates.map((date, index) => ({
    date,
    weatherCode: weatherCode(weatherCodes[index]),
    minimumC: finiteNumber(minimums[index]),
    maximumC: finiteNumber(maximums[index]),
    precipitationProbabilityPercent: boundedNumber(precipitation[index], 0, 100),
  }));
}

export async function getWeather(city: City): Promise<WeatherData> {
  const url = new URL(FORECAST_URL);
  url.search = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current:
      'temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,precipitation,pressure_msl',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
    forecast_days: '5',
  }).toString();

  const payload = await fetchJson(url.toString());
  if (
    !isRecord(payload) ||
    !isRecord(payload.current) ||
    !isRecord(payload.daily) ||
    !Array.isArray(payload.daily.time)
  ) {
    throw new WeatherServiceError('A resposta do Open-Meteo está incompleta.', 'invalid-response');
  }

  let timezone: string | null = null;
  if (typeof payload.timezone === 'string' && payload.timezone) {
    try {
      new Intl.DateTimeFormat('en', { timeZone: payload.timezone });
      timezone = payload.timezone;
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
    }
  }
  const utcOffsetSeconds = finiteNumber(payload.utc_offset_seconds);
  return {
    city,
    timezone,
    current: mapCurrent(payload.current, utcOffsetSeconds),
    forecast: mapForecast(payload.daily, timezone),
  };
}
