import { useEffect, useState } from 'react';
import { formatMetric, formatObservationTime, isCurrentObservation } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../types/weather';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData;
  unit: Unit;
  timezone: string | null;
}

export default function CurrentWeather({ city, current, unit, timezone }: CurrentWeatherProps) {
  const [, setExpired] = useState(false);
  const isCurrent = isCurrentObservation(current.observedAt);

  useEffect(() => {
    if (!current.observedAt || !isCurrentObservation(current.observedAt)) return;
    const remaining = Date.parse(current.observedAt) + 2 * 60 * 60 * 1000 - Date.now() + 1;
    const timer = window.setTimeout(() => setExpired((value) => !value), Math.max(remaining, 1));
    return () => window.clearTimeout(timer);
  }, [current.observedAt]);

  const condition = getWeatherCondition(isCurrent ? current.weatherCode : null);
  const metrics = [
    { label: 'Umidade', value: formatMetric(current.humidityPercent, '%', 100) },
    { label: 'Vento', value: formatMetric(current.windSpeedKmh, 'km/h') },
    { label: 'Precipitação', value: formatMetric(current.precipitationMm, 'mm') },
    { label: 'Pressão', value: formatMetric(current.pressureHpa, 'hPa') },
  ];

  return (
    <section
      aria-labelledby="current-weather-title"
      className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glass backdrop-blur-md sm:p-8"
    >
      <p className="text-sm font-medium text-slate-300">Clima atual</p>
      <h2
        id="current-weather-title"
        className="mt-1 break-words text-2xl font-semibold sm:text-3xl"
      >
        {city.name}
      </h2>
      {isCurrent ? (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-5">
            {condition.icon && (
              <span aria-hidden="true" className="text-6xl">
                {condition.icon}
              </span>
            )}
            <div>
              <p className="break-words text-4xl font-semibold tracking-tight sm:text-6xl">
                {formatTemperature(current.temperatureC, unit)}
              </p>
              <p className="mt-2 text-lg text-slate-200">{condition.description}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-300">
            Observação: {formatObservationTime(current.observedAt ?? '', timezone)}
          </p>
          <dl className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="min-w-0 rounded-xl bg-night-900/60 p-3">
                <dt className="text-sm text-slate-300">{metric.label}</dt>
                <dd className="mt-1 break-words font-semibold">{metric.value}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <p className="mt-5 text-slate-200">Dados atuais desatualizados ou indisponíveis.</p>
      )}
      <p className="mt-6 text-xs text-slate-300">Modelo de dados: Open-Meteo</p>
    </section>
  );
}
