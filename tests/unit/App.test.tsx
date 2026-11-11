import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { createMockWeatherData } from '../../src/mocks/weather';
import { getWeather, searchCities } from '../../src/services/weatherService';

vi.mock('../../src/services/weatherService', () => ({
  getWeather: vi.fn(),
  searchCities: vi.fn(),
  WeatherServiceError: class WeatherServiceError extends Error {},
}));

const weather = createMockWeatherData();

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('busca e exige selecionar uma cidade antes de mostrar o clima', async () => {
    const user = userEvent.setup();
    vi.mocked(searchCities).mockResolvedValue([weather.city]);
    vi.mocked(getWeather).mockResolvedValue(weather);
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Comece sua busca' })).toBeInTheDocument();
    const input = screen.getByRole('searchbox', { name: 'Nome da cidade' });
    await user.type(input, 'São Paulo{Enter}');
    expect(
      await screen.findByRole('heading', { name: 'Selecione uma cidade' }),
    ).toBeInTheDocument();
    expect(getWeather).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /São Paulo/ }));
    expect(await screen.findByRole('heading', { name: 'São Paulo' })).toBeInTheDocument();
    expect(screen.getByText('23 °C')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));
    expect(screen.getByText('73 °F')).toBeInTheDocument();
    expect(screen.getByText('Previsão para 5 dias')).toBeInTheDocument();
  });

  it('apresenta estado vazio quando não encontra cidades', async () => {
    const user = userEvent.setup();
    vi.mocked(searchCities).mockResolvedValue([]);
    render(<App />);

    await user.type(screen.getByRole('searchbox', { name: 'Nome da cidade' }), 'Recife{Enter}');
    expect(
      await screen.findByRole('heading', { name: 'Cidade não encontrada' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Recife/)).toBeInTheDocument();
  });

  it('exibe coordenadas quando o resultado não tem região nem país', async () => {
    const user = userEvent.setup();
    vi.mocked(searchCities).mockResolvedValue([
      { ...weather.city, admin1: null, country: null },
      {
        ...weather.city,
        id: weather.city.id + 1,
        admin1: null,
        country: null,
        latitude: -22.9,
        longitude: -43.2,
      },
    ]);
    render(<App />);

    await user.type(screen.getByRole('searchbox', { name: 'Nome da cidade' }), 'São Paulo{Enter}');

    expect(await screen.findByText('Coordenadas: -23.5475, -46.6361')).toBeInTheDocument();
    expect(screen.getByText('Coordenadas: -22.9, -43.2')).toBeInTheDocument();
  });

  it('mostra erro e retry repete a busca que falhou', async () => {
    const user = userEvent.setup();
    vi.mocked(searchCities)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([weather.city]);
    render(<App />);

    await user.type(screen.getByRole('searchbox', { name: 'Nome da cidade' }), 'Curitiba{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível concluir a consulta. Tente novamente.',
    );
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(
      await screen.findByRole('heading', { name: 'Selecione uma cidade' }),
    ).toBeInTheDocument();
    expect(searchCities).toHaveBeenCalledTimes(2);
  });

  it('marca o carregamento e move o foco para o resultado da busca', async () => {
    const user = userEvent.setup();
    let resolveSearch: ((cities: Array<typeof weather.city>) => void) | undefined;
    vi.mocked(searchCities).mockReturnValue(
      new Promise((resolve) => {
        resolveSearch = resolve;
      }),
    );
    render(<App />);

    await user.type(screen.getByRole('searchbox', { name: 'Nome da cidade' }), 'São Paulo{Enter}');
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Carregando dados...');

    await act(async () => {
      resolveSearch?.([weather.city]);
    });

    expect(
      await screen.findByRole('heading', { name: 'Selecione uma cidade' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Resultado da consulta' })).toHaveFocus();
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'false');
  });
});
