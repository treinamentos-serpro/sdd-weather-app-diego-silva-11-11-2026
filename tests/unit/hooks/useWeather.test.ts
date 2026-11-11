import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWeather } from '../../../src/hooks/useWeather';
import { createMockWeatherData } from '../../../src/mocks/weather';
import { getWeather, searchCities } from '../../../src/services/weatherService';

vi.mock('../../../src/services/weatherService', () => ({
  getWeather: vi.fn(),
  searchCities: vi.fn(),
  WeatherServiceError: class WeatherServiceError extends Error {},
}));

const city = createMockWeatherData().city;

describe('useWeather', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('busca cidades, aguarda seleção explícita e carrega a previsão escolhida', async () => {
    vi.mocked(searchCities).mockResolvedValue([city]);
    vi.mocked(getWeather).mockResolvedValue(createMockWeatherData());
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search(' São Paulo ');
    });
    expect(result.current.status).toBe('success');
    expect(result.current.query).toBe('São Paulo');
    expect(result.current.cities).toEqual([city]);
    expect(getWeather).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.selectCity(city);
    });
    expect(getWeather).toHaveBeenCalledExactlyOnceWith(city);
    expect(result.current.data?.city).toEqual(city);
  });

  it('marca busca sem resultados como vazia e repete somente a operação que falhou', async () => {
    vi.mocked(searchCities).mockResolvedValueOnce([]);
    const { result } = renderHook(() => useWeather());
    await act(async () => {
      await result.current.search('Recife');
    });
    expect(result.current.status).toBe('empty');
    expect(getWeather).not.toHaveBeenCalled();

    vi.mocked(searchCities).mockRejectedValueOnce(new Error('offline'));
    await act(async () => {
      await result.current.search('Curitiba');
    });
    vi.mocked(searchCities).mockResolvedValueOnce([city]);
    await act(async () => {
      await result.current.retry();
    });
    await waitFor(() => expect(result.current.cities).toEqual([city]));
    expect(searchCities).toHaveBeenCalledTimes(3);
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('limpa dados anteriores antes da nova consulta e mantém cidade disponível para retry', async () => {
    vi.mocked(getWeather)
      .mockResolvedValueOnce(createMockWeatherData())
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(createMockWeatherData());
    const secondCity = { ...city, id: 2, name: 'Recife' };
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.selectCity(city);
    });
    await act(async () => {
      await result.current.selectCity(secondCity);
    });
    expect(result.current.status).toBe('error');
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Ocorreu um erro inesperado.');

    await act(async () => {
      await result.current.retry();
    });
    expect(getWeather).toHaveBeenLastCalledWith(secondCity);
    expect(result.current.data?.city).toEqual(city);
  });
});
