import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SearchBar from '../../../src/components/SearchBar';

describe('SearchBar', () => {
  it('identifica o campo e informa o envio do nome ao Open-Meteo', () => {
    render(<SearchBar onSearch={vi.fn()} />);

    expect(screen.getByRole('search', { name: 'Buscar cidade' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Nome da cidade' })).toHaveAccessibleDescription(
      'O nome da cidade será enviado ao Open-Meteo.',
    );
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeEnabled();
  });

  it('valida campos vazios e com apenas espaços e permite corrigir', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByRole('searchbox', { name: 'Nome da cidade' });

    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Informe o nome da cidade.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(
      'O nome da cidade será enviado ao Open-Meteo. Informe o nome da cidade.',
    );
    expect(onSearch).not.toHaveBeenCalled();

    await user.type(input, '   ');
    await user.keyboard('{Enter}');
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(onSearch).not.toHaveBeenCalled();

    await user.type(input, 'São Luís');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(onSearch).toHaveBeenCalledOnce();
    expect(onSearch).toHaveBeenCalledWith('São Luís');
  });

  it('envia pelo botão preservando os caracteres e espaços internos', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox', { name: 'Nome da cidade' }), '  São  Luís  ');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('São  Luís');
  });

  it('impede nova busca enquanto desabilitado, inclusive em submit programático', () => {
    const onSearch = vi.fn();
    const { rerender } = render(<SearchBar onSearch={onSearch} />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Nome da cidade' }), {
      target: { value: 'Recife' },
    });
    rerender(<SearchBar onSearch={onSearch} disabled />);

    expect(screen.getByRole('searchbox', { name: 'Nome da cidade' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    fireEvent.submit(screen.getByRole('search', { name: 'Buscar cidade' }));
    expect(onSearch).not.toHaveBeenCalled();

    rerender(<SearchBar onSearch={onSearch} />);
    fireEvent.submit(screen.getByRole('search', { name: 'Buscar cidade' }));
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('Recife');
  });
});
