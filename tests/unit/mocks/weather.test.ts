import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  City,
  CurrentWeather,
  ForecastDay,
  Unit,
  WeatherData,
} from '../../../src/types/weather';

describe('contratos meteorológicos', () => {
  it('mantém os campos e a nulabilidade definidos no plano', () => {
    expectTypeOf<Unit>().toEqualTypeOf<'celsius' | 'fahrenheit'>();
    expectTypeOf<City>().toEqualTypeOf<{
      id: number;
      name: string;
      admin1: string | null;
      country: string | null;
      latitude: number;
      longitude: number;
    }>();
    expectTypeOf<CurrentWeather>().toEqualTypeOf<{
      temperatureC: number | null;
      weatherCode: number | null;
      observedAt: string | null;
      humidityPercent: number | null;
      windSpeedKmh: number | null;
      precipitationMm: number | null;
      pressureHpa: number | null;
    }>();
    expectTypeOf<ForecastDay>().toEqualTypeOf<{
      date: string;
      weatherCode: number | null;
      minimumC: number | null;
      maximumC: number | null;
      precipitationProbabilityPercent: number | null;
    }>();
    expectTypeOf<WeatherData>().toEqualTypeOf<{
      city: City;
      timezone: string | null;
      current: CurrentWeather;
      forecast: ForecastDay[] | null;
    }>();
  });
});

describe('mock meteorológico', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it('fornece uma observação atual e cinco datas locais consecutivas na virada do ano', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2027-01-01T01:00:00Z'));
    const { mockWeatherData } = await import('../../../src/mocks/weather');

    expect(mockWeatherData.city.name).toBe('São Paulo');
    expect(mockWeatherData.timezone).toBe('America/Sao_Paulo');
    expect(mockWeatherData.current).toEqual({
      temperatureC: 23,
      weatherCode: 2,
      observedAt: '2027-01-01T01:00:00.000Z',
      humidityPercent: 68,
      windSpeedKmh: 12,
      precipitationMm: 0,
      pressureHpa: 1015,
    });
    expect(mockWeatherData.forecast).toHaveLength(5);
    expect(mockWeatherData.forecast?.map((day) => day.date)).toEqual([
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
      '2027-01-04',
    ]);
    for (const day of mockWeatherData.forecast ?? []) {
      expect(day.weatherCode).not.toBeNull();
      expect(day.minimumC).not.toBeNull();
      expect(day.maximumC).not.toBeNull();
      if (day.minimumC !== null && day.maximumC !== null) {
        expect(day.minimumC).toBeLessThanOrEqual(day.maximumC);
      }
    }
  });
});
