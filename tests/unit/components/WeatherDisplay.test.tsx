import { useState } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CurrentWeather from '../../../src/components/CurrentWeather';
import ForecastList from '../../../src/components/ForecastList';
import UnitToggle from '../../../src/components/UnitToggle';
import { createMockWeatherData } from '../../../src/mocks/weather';
import type { Unit } from '../../../src/types/weather';

describe('apresentação meteorológica', () => {
  afterEach(() => vi.useRealTimers());

  it('mostra clima, métricas e cinco dias e converte as temperaturas', () => {
    const now = new Date('2026-11-11T15:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const weather = createMockWeatherData(now);
    const { rerender } = render(
      <>
        <CurrentWeather
          city={weather.city}
          current={weather.current}
          unit="celsius"
          timezone={weather.timezone}
        />
        <ForecastList forecast={weather.forecast} unit="celsius" />
      </>,
    );
    expect(screen.getByRole('heading', { name: 'São Paulo' })).toBeInTheDocument();
    expect(screen.getByText('23 °C')).toBeInTheDocument();
    expect(screen.getByText('Observação: 12:00')).toBeInTheDocument();
    expect(screen.getByText('68 %')).toBeInTheDocument();
    expect(screen.getByText('12 km/h')).toBeInTheDocument();
    expect(screen.getByText('0 mm')).toBeInTheDocument();
    expect(screen.getByText('1.015 hPa')).toBeInTheDocument();
    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(5);
    expect(within(list).getByText('80 %')).toBeInTheDocument();
    expect(within(list).getByText('25 °C')).toBeInTheDocument();

    rerender(
      <>
        <CurrentWeather
          city={weather.city}
          current={weather.current}
          unit="fahrenheit"
          timezone={weather.timezone}
        />
        <ForecastList forecast={weather.forecast} unit="fahrenheit" />
      </>,
    );
    expect(screen.getByText('73 °F')).toBeInTheDocument();
    expect(within(list).getByText('77 °F')).toBeInTheDocument();
    expect(within(list).getByText('80 %')).toBeInTheDocument();
  });

  it('converte 0 °C para 32 °F ao alternar a unidade pelo controle acessível', () => {
    const now = new Date('2026-11-11T15:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const weather = createMockWeatherData(now);
    const current = { ...weather.current, temperatureC: 0 };

    function WeatherWithUnitToggle() {
      const [unit, setUnit] = useState<Unit>('celsius');
      return (
        <>
          <UnitToggle unit={unit} onChange={setUnit} />
          <CurrentWeather
            city={weather.city}
            current={current}
            unit={unit}
            timezone={weather.timezone}
          />
        </>
      );
    }

    render(<WeatherWithUnitToggle />);
    expect(screen.getByText('0 °C')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '°F' }));
    expect(screen.getByText('32 °F')).toBeInTheDocument();
  });

  it('oculta observações vencidas e trata campos indisponíveis independentemente', () => {
    const now = new Date('2026-11-11T15:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const weather = createMockWeatherData(now);
    const current = {
      ...weather.current,
      temperatureC: null,
      weatherCode: 999,
      humidityPercent: 101,
    };
    const { rerender } = render(
      <CurrentWeather city={weather.city} current={current} unit="celsius" timezone={null} />,
    );
    expect(screen.getByText('Condição indisponível')).toBeInTheDocument();
    expect(screen.getByText('Observação: Horário local indisponível')).toBeInTheDocument();
    expect(screen.getAllByText('Indisponível')).toHaveLength(2);
    rerender(
      <CurrentWeather
        city={{ ...weather.city, name: 'Recife' }}
        current={{ ...weather.current, observedAt: '2026-11-11T12:59:59Z' }}
        unit="celsius"
        timezone={weather.timezone}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Recife' })).toBeInTheDocument();
    expect(screen.queryByText('23 °C')).not.toBeInTheDocument();
    expect(screen.getByText('Dados atuais desatualizados ou indisponíveis.')).toBeInTheDocument();
  });

  it('informa previsão ausente', () => {
    render(<ForecastList forecast={null} unit="celsius" />);
    expect(screen.getByText('Previsão indisponível.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('deixa de apresentar dados atuais quando a observação vence', () => {
    const now = new Date('2026-11-11T15:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const weather = createMockWeatherData(now);
    render(
      <CurrentWeather
        city={weather.city}
        current={weather.current}
        unit="celsius"
        timezone={weather.timezone}
      />,
    );
    expect(screen.getByText('23 °C')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(2 * 60 * 60 * 1000 + 1));
    expect(screen.queryByText('23 °C')).not.toBeInTheDocument();
    expect(screen.getByText('Dados atuais desatualizados ou indisponíveis.')).toBeInTheDocument();
  });
});
