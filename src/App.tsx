import { useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import { useWeather } from './hooks/useWeather';
import type { Unit } from './types/weather';

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const { status, data, cities, error, query, search, selectCity, retry } = useWeather();

  return (
    <div className="min-h-screen bg-night-900 font-sans text-white">
      <header className="border-b border-white/10 bg-night-800/80">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-accent-400">
                SDD Weather
              </p>
              <h1 className="mt-1 text-2xl font-semibold">Previsão do tempo</h1>
            </div>
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
          <p className="my-4 rounded-lg border border-accent-400/40 bg-night-900/70 p-3 text-sm text-slate-100">
            O nome da cidade será enviado ao Open-Meteo para localizar previsões meteorológicas.
          </p>
          <SearchBar onSearch={search} disabled={status === 'loading'} />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        {status === 'idle' && (
          <EmptyState
            title="Comece sua busca"
            hint="Pesquise uma cidade para consultar o clima e a previsão para cinco dias."
          />
        )}
        {status === 'loading' && <LoadingState />}
        {status === 'empty' && (
          <EmptyState
            title="Cidade não encontrada"
            hint={`Nenhuma cidade foi encontrada para “${query}”.`}
          />
        )}
        {status === 'error' && (
          <ErrorState message={error ?? 'Não foi possível concluir a consulta.'} onRetry={retry} />
        )}
        {status === 'success' && !data && (
          <section aria-labelledby="cities-title" className="space-y-3">
            <h2 id="cities-title" className="text-xl font-semibold">
              Selecione uma cidade
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cities.map((city) => (
                <li key={city.id}>
                  <button
                    type="button"
                    onClick={() => selectCity(city)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-glass backdrop-blur-md hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
                  >
                    <span className="block font-semibold">{city.name}</span>
                    <span className="mt-1 block text-sm text-slate-300">
                      {[city.admin1, city.country].filter(Boolean).join(', ') ||
                        'Localização disponível'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {status === 'success' && data && (
          <>
            <CurrentWeather
              city={data.city}
              current={data.current}
              unit={unit}
              timezone={data.timezone}
            />
            <ForecastList forecast={data.forecast} unit={unit} />
          </>
        )}
      </main>
    </div>
  );
}
