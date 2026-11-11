import { describe, expect, it } from 'vitest';
import { formatTemperature } from '../../src/lib/temperature';

describe('formatTemperature', () => {
  it.each([
    [0, '32 °F'],
    [100, '212 °F'],
    [-40, '-40 °F'],
  ])('converte %s °C para %s', (value, expected) => {
    expect(formatTemperature(value, 'fahrenheit')).toBe(expected);
  });

  it('mantém Celsius e aplica a unidade selecionada', () => {
    expect(formatTemperature(0, 'celsius')).toBe('0 °C');
    expect(formatTemperature(20, 'fahrenheit')).toBe('68 °F');
  });

  it('arredonda empates afastando-se de zero e inclui o símbolo da unidade', () => {
    expect(formatTemperature(0.5, 'celsius')).toBe('1 °C');
    expect(formatTemperature(-0.5, 'celsius')).toBe('-1 °C');
    expect(formatTemperature(-40.5, 'fahrenheit')).toBe('-41 °F');
  });

  it('não inventa uma temperatura quando o valor é inválido', () => {
    expect(formatTemperature(null, 'fahrenheit')).toBe('Indisponível');
    expect(formatTemperature(Number.POSITIVE_INFINITY, 'celsius')).toBe('Indisponível');
  });
});
