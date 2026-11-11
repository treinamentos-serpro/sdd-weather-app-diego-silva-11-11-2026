import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../../src/App';

describe('protótipo navegável', () => {
  it('alterna unidades e demonstra estados sem apresentar dados fictícios como reais', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByText(/Demonstração com dados fictícios/)).toBeInTheDocument();
    expect(screen.getByText('23 °C')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '°F' }));
    expect(screen.getByText('73 °F')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Erro' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Erro simulado');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(screen.getByRole('status')).toHaveTextContent('Carregando');
    expect(await screen.findByText('73 °F')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Vazio' }));
    expect(screen.getByRole('heading', { name: 'Cidade não encontrada' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Início' }));
    expect(screen.getByRole('heading', { name: 'Comece sua busca' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Carregando' }));
    expect(screen.getByRole('status')).toHaveTextContent('Carregando');
    await user.click(screen.getByRole('button', { name: 'Resultado' }));
    expect(screen.getByText('73 °F')).toBeInTheDocument();
  });

  it('busca somente a cidade de exemplo e permite recuperar de resultado vazio', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByRole('searchbox', { name: 'Nome da cidade' });
    await user.type(input, 'Recife{Enter}');
    expect(
      await screen.findByRole('heading', { name: 'Cidade não encontrada' }),
    ).toBeInTheDocument();
    await user.clear(input);
    await user.type(input, 'sao paulo{Enter}');
    expect(await screen.findByRole('heading', { name: 'São Paulo' })).toBeInTheDocument();
  });
});
