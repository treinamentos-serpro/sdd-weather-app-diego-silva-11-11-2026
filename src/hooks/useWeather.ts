import { useRef, useState } from 'react';
import { getWeather, searchCities, WeatherServiceError } from '../services/weatherService';
import type { City, WeatherData } from '../types/weather';

export type WeatherStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

interface UseWeatherResult {
  status: WeatherStatus;
  data: WeatherData | null;
  cities: City[];
  error: string | null;
  query: string;
  search: (name: string) => Promise<void>;
  selectCity: (city: City) => Promise<void>;
  retry: () => Promise<void>;
}

type LastOperation = { type: 'search'; query: string } | { type: 'weather'; city: City };

function getErrorMessage(error: unknown): string {
  if (error instanceof WeatherServiceError) return error.message;
  return 'Não foi possível concluir a consulta. Tente novamente.';
}

export function useWeather(): UseWeatherResult {
  const [status, setStatus] = useState<WeatherStatus>('idle');
  const [data, setData] = useState<WeatherData | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const operation = useRef<LastOperation | null>(null);
  const busy = useRef(false);

  async function search(name: string): Promise<void> {
    if (busy.current) return;
    const normalizedQuery = name.trim();
    setQuery(normalizedQuery);
    if (!normalizedQuery) {
      setCities([]);
      setData(null);
      setError(null);
      setStatus('idle');
      operation.current = null;
      return;
    }

    busy.current = true;
    operation.current = { type: 'search', query: normalizedQuery };
    setStatus('loading');
    setData(null);
    setCities([]);
    setError(null);
    try {
      const results = await searchCities(normalizedQuery);
      setCities(results);
      setStatus(results.length ? 'success' : 'empty');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setStatus('error');
    } finally {
      busy.current = false;
    }
  }

  async function selectCity(city: City): Promise<void> {
    if (busy.current) return;
    busy.current = true;
    operation.current = { type: 'weather', city };
    setStatus('loading');
    setData(null);
    setError(null);
    try {
      const result = await getWeather(city);
      setData(result);
      setStatus('success');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setStatus('error');
    } finally {
      busy.current = false;
    }
  }

  async function retry(): Promise<void> {
    if (busy.current) return;
    const lastOperation = operation.current;
    if (lastOperation?.type === 'search') return search(lastOperation.query);
    if (lastOperation?.type === 'weather') return selectCity(lastOperation.city);
  }

  return { status, data, cities, error, query, search, selectCity, retry };
}
