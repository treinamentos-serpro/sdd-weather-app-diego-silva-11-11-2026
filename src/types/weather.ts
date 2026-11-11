export type Unit = 'celsius' | 'fahrenheit';

export interface City {
  id: number;
  name: string;
  admin1: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  temperatureC: number | null;
  weatherCode: number | null;
  observedAt: string | null;
  humidityPercent: number | null;
  windSpeedKmh: number | null;
  precipitationMm: number | null;
  pressureHpa: number | null;
}

export interface ForecastDay {
  date: string;
  weatherCode: number | null;
  minimumC: number | null;
  maximumC: number | null;
  precipitationProbabilityPercent: number | null;
}

export interface WeatherData {
  city: City;
  timezone: string | null;
  current: CurrentWeather;
  forecast: ForecastDay[] | null;
}
