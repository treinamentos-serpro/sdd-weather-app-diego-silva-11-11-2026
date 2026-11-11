import type { ForecastDay, Unit } from '../types/weather';
import ForecastCard from './ForecastCard';

interface ForecastListProps {
  forecast: ForecastDay[] | null;
  unit: Unit;
}

export default function ForecastList({ forecast, unit }: ForecastListProps) {
  return (
    <section aria-labelledby="forecast-title">
      <h2 id="forecast-title" className="text-xl font-semibold">
        Previsão para 5 dias
      </h2>
      {forecast && forecast.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {forecast.map((day, index) => (
            <ForecastCard key={day.date ?? `unavailable-${index}`} day={day} unit={unit} />
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-slate-200">Previsão indisponível.</p>
      )}
      <p className="mt-4 text-xs text-slate-300">Modelo de dados: Open-Meteo</p>
    </section>
  );
}
