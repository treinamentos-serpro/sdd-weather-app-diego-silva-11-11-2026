import { useEffect, useRef, useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import { createMockWeatherData } from './mocks/weather';
import type { Unit, WeatherData } from './types/weather';

type DemoState = 'idle' | 'loading' | 'empty' | 'error' | 'success';

const demoStates: { value: DemoState; label: string }[] = [
  { value: 'idle', label: 'Início' },
  { value: 'loading', label: 'Carregando' },
  { value: 'empty', label: 'Vazio' },
  { value: 'error', label: 'Erro' },
  { value: 'success', label: 'Resultado' },
];

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const [state, setState] = useState<DemoState>('success');
  const [weather, setWeather] = useState<WeatherData>(() => createMockWeatherData());
  const [lastQuery, setLastQuery] = useState('São Paulo');
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  function cancelPendingSearch() {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }

  function search(city: string) {
    cancelPendingSearch();
    setLastQuery(city);
    setState('loading');
    timer.current = window.setTimeout(() => {
      timer.current = null;
      const normalized = city
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLocaleLowerCase('pt-BR');
      if (normalized === 'sao paulo') {
        setWeather(createMockWeatherData());
        setState('success');
      } else {
        setState('empty');
      }
    }, 400);
  }

  function showState(nextState: DemoState) {
    cancelPendingSearch();
    if (nextState === 'success') setWeather(createMockWeatherData());
    setState(nextState);
  }

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
            Demonstração com dados fictícios: nenhuma busca é enviada à API. Apenas São Paulo está
            disponível.
          </p>
          <SearchBar
            onSearch={search}
            disabled={state === 'loading'}
            privacyMessage="Nesta demonstração, a busca permanece no navegador e não é enviada ao Open-Meteo."
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <section aria-labelledby="demo-title">
          <h2 id="demo-title" className="text-sm font-semibold text-slate-200">
            Demonstrar estados da interface
          </h2>
          <div
            className="mt-3 flex flex-wrap gap-2"
            role="group"
            aria-label="Estados de demonstração"
          >
            {demoStates.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={state === item.value}
                onClick={() => showState(item.value)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  state === item.value
                    ? 'border-accent-400 bg-accent-500 text-night-900'
                    : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {state === 'idle' && (
          <EmptyState
            title="Comece sua busca"
            hint="Pesquise por São Paulo para visualizar os dados de exemplo."
          />
        )}
        {state === 'loading' && <LoadingState message="Carregando dados simulados..." />}
        {state === 'empty' && (
          <EmptyState
            title="Cidade não encontrada"
            hint="Na demonstração, pesquise por São Paulo."
          />
        )}
        {state === 'error' && (
          <ErrorState
            message="Erro simulado: não foi possível concluir a busca."
            onRetry={() => search(lastQuery)}
          />
        )}
        {state === 'success' && (
          <>
            <CurrentWeather
              city={weather.city}
              current={weather.current}
              unit={unit}
              timezone={weather.timezone}
            />
            <ForecastList forecast={weather.timezone ? weather.forecast : null} unit={unit} />
          </>
        )}
      </main>
    </div>
  );
}
