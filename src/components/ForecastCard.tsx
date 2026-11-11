import { formatForecastDate, formatMetric } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { ForecastDay, Unit } from '../types/weather';

interface ForecastCardProps {
  day: ForecastDay;
  unit: Unit;
}

export default function ForecastCard({ day, unit }: ForecastCardProps) {
  const condition = getWeatherCondition(day.weatherCode);

  return (
    <li className="min-w-0 break-words rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
      <h3 className="font-semibold capitalize">{formatForecastDate(day.date)}</h3>
      {condition.icon && (
        <span aria-hidden="true" className="mt-4 block text-4xl">
          {condition.icon}
        </span>
      )}
      <p className="mt-3 min-h-10 text-sm text-slate-200">{condition.description}</p>
      <dl className="mt-4 space-y-2 text-sm">
        <div>
          <dt className="text-slate-300">Máxima</dt>
          <dd className="font-semibold">{formatTemperature(day.maximumC, unit)}</dd>
        </div>
        <div>
          <dt className="text-slate-300">Mínima</dt>
          <dd className="font-semibold">{formatTemperature(day.minimumC, unit)}</dd>
        </div>
        <div>
          <dt className="text-slate-300">Chance de chuva</dt>
          <dd className="font-semibold">
            {formatMetric(day.precipitationProbabilityPercent, '%', 100)}
          </dd>
        </div>
      </dl>
    </li>
  );
}
