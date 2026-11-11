import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getWeather,
  searchCities,
  type WeatherServiceError,
} from '../../../src/services/weatherService';
import type { City } from '../../../src/types/weather';

const city: City = {
  id: 1,
  name: 'São Paulo',
  admin1: 'São Paulo',
  country: 'Brasil',
  latitude: -23.55,
  longitude: -46.63,
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('weatherService', () => {
  it('não consulta a rede para nomes vazios e codifica parâmetros de geocoding', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities('   ')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { ...city, admin1: undefined, country: undefined },
          { ...city, id: -1 },
          ...Array.from({ length: 5 }, (_, index) => ({ ...city, id: index + 2 })),
        ],
      }),
    });

    const cities = await searchCities('  São Paulo & Centro  ');
    const requestedUrl = new URL(fetchMock.mock.calls[0][0]);
    expect(requestedUrl.searchParams.get('name')).toBe('São Paulo & Centro');
    expect(requestedUrl.searchParams.get('count')).toBe('5');
    expect(requestedUrl.searchParams.get('language')).toBe('pt');
    expect(cities).toHaveLength(4);
    expect(cities[0]).toMatchObject({ admin1: null, country: null });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ results: [] }) });
    await expect(searchCities('Nenhuma cidade')).resolves.toEqual([]);
  });

  it.each([
    "L'Aquila",
    'Zürich',
  ])('preserva caracteres especiais em buscas por %s', async (name) => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities(` ${name} `)).resolves.toEqual([]);
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get('name')).toBe(name);
  });

  it('mapeia clima atual e cinco dias usando as coordenadas selecionadas', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-11T15:00:00Z'));
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        timezone: 'America/Sao_Paulo',
        utc_offset_seconds: -10_800,
        current: {
          time: '2026-11-11T14:00',
          temperature_2m: 22.5,
          weather_code: 3,
          relative_humidity_2m: 61,
          wind_speed_10m: 10,
          precipitation: 0,
          pressure_msl: 1012,
        },
        daily: {
          time: ['2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15'],
          weather_code: [1, 2, 3, 45, 61],
          temperature_2m_min: [12, 13, 14, 15, 16],
          temperature_2m_max: [20, 21, 22, 23, 24],
          precipitation_probability_max: [0, 10, 20, 30, 40],
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await getWeather(city);
    const requestedUrl = new URL(fetchMock.mock.calls[0][0]);
    expect(requestedUrl.searchParams.get('latitude')).toBe(String(city.latitude));
    expect(requestedUrl.searchParams.get('longitude')).toBe(String(city.longitude));
    expect(requestedUrl.searchParams.get('forecast_days')).toBe('5');
    expect(requestedUrl.searchParams.get('timezone')).toBe('auto');
    expect(requestedUrl.searchParams.get('temperature_unit')).toBe('celsius');
    expect(result.current).toMatchObject({
      temperatureC: 22.5,
      observedAt: '2026-11-11T17:00:00.000Z',
    });
    expect(result.forecast).toHaveLength(5);
    expect(result.forecast?.[0]).toMatchObject({
      date: '2026-11-11',
      minimumC: 12,
      maximumC: 20,
      precipitationProbabilityPercent: 0,
    });
  });

  it('preserva a indisponibilidade de precipitação ausente em vez de inventar zero', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-11T15:00:00Z'));
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        timezone: 'America/Sao_Paulo',
        utc_offset_seconds: -10_800,
        current: {
          time: '2026-11-11T12:00',
          temperature_2m: 22,
          precipitation: null,
        },
        daily: {
          time: ['2026-11-11', '2026-11-12', '2026-11-14', '2026-11-15'],
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(getWeather(city)).resolves.toMatchObject({
      current: { precipitationMm: null },
      forecast: [
        {
          weatherCode: null,
          minimumC: null,
          maximumC: null,
          precipitationProbabilityPercent: null,
        },
        { weatherCode: null, minimumC: null, maximumC: null },
        { weatherCode: null, minimumC: null, maximumC: null },
        { weatherCode: null, minimumC: null, maximumC: null },
        { weatherCode: null, minimumC: null, maximumC: null },
      ],
    });
    const result = await getWeather(city);
    expect(result.forecast).toHaveLength(5);
    expect(result.forecast?.[2].date).toBeNull();
  });

  it.each([
    ['sem dados meteorológicos', {}],
    ['resposta não estruturada', null],
  ])('rejeita resposta inválida: %s', async (_description, payload) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => payload,
      }),
    );

    await expect(getWeather(city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      code: 'invalid-response',
      message: 'Não foi possível interpretar os dados recebidos. Tente novamente.',
    } satisfies Partial<WeatherServiceError>);
  });

  it('mantém o clima atual quando a previsão diária não está disponível', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-11T15:00:00Z'));
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          timezone: 'America/Sao_Paulo',
          utc_offset_seconds: -10_800,
          current: {
            time: '2026-11-11T12:00',
            temperature_2m: 22,
          },
          daily: { weather_code: [] },
        }),
      }),
    );

    await expect(getWeather(city)).resolves.toMatchObject({
      current: { temperatureC: 22 },
      forecast: null,
    });
  });

  it('classifica respostas HTTP e payload incompleto como erros do serviço', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: null }),
      });
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities('Recife')).rejects.toMatchObject({
      name: 'WeatherServiceError',
      code: 'http',
    } satisfies Partial<WeatherServiceError>);
    await expect(getWeather(city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      code: 'invalid-response',
    } satisfies Partial<WeatherServiceError>);
    await expect(searchCities('Recife')).rejects.toMatchObject({
      code: 'invalid-response',
      message: 'Não foi possível interpretar os dados recebidos. Tente novamente.',
    } satisfies Partial<WeatherServiceError>);
  });

  it('classifica falhas de rede e JSON inválido sem ocultar o erro', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('connection failed'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new SyntaxError('invalid JSON');
        },
      });
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities('Natal')).rejects.toMatchObject({
      code: 'network',
      message: 'Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.',
    });
    await expect(searchCities('Natal')).rejects.toMatchObject({
      code: 'invalid-response',
      message: 'Não foi possível interpretar os dados recebidos. Tente novamente.',
    });
  });

  it('aborta após dez segundos e classifica o erro como timeout', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((_url: string, options: RequestInit) => {
      const signal = options.signal as AbortSignal;
      return new Promise<Response>((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const request = searchCities('Curitiba');
    const rejection = expect(request).rejects.toMatchObject({
      name: 'WeatherServiceError',
      code: 'timeout',
      message:
        'A consulta excedeu o limite de 10 segundos. Verifique sua conexão e tente novamente.',
    });
    await vi.advanceTimersByTimeAsync(10_000);
    await rejection;
    expect(fetchMock.mock.calls[0][1].signal?.aborted).toBe(true);
  });
});
