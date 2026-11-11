import type { WeatherData } from '../types/weather';

const timezone = 'America/Sao_Paulo';
export function createMockWeatherData(now = new Date()): WeatherData {
  const localDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const firstDay = new Date(`${localDate}T00:00:00Z`).getTime();

  return {
    city: {
      id: 3448439,
      name: 'São Paulo',
      admin1: 'São Paulo',
      country: 'Brasil',
      latitude: -23.5475,
      longitude: -46.6361,
    },
    timezone,
    current: {
      temperatureC: 23,
      weatherCode: 2,
      observedAt: now.toISOString(),
      humidityPercent: 68,
      windSpeedKmh: 12,
      precipitationMm: 0,
      pressureHpa: 1015,
    },
    forecast: [
      { weatherCode: 2, minimumC: 18, maximumC: 25, precipitationProbabilityPercent: 20 },
      { weatherCode: 3, minimumC: 17, maximumC: 24, precipitationProbabilityPercent: 30 },
      { weatherCode: 61, minimumC: 18, maximumC: 22, precipitationProbabilityPercent: 80 },
      { weatherCode: 1, minimumC: 16, maximumC: 26, precipitationProbabilityPercent: 10 },
      { weatherCode: 0, minimumC: 17, maximumC: 28, precipitationProbabilityPercent: 5 },
    ].map((day, index) => ({
      ...day,
      date: new Date(firstDay + index * 86_400_000).toISOString().slice(0, 10),
    })),
  };
}

export const mockWeatherData = createMockWeatherData();
