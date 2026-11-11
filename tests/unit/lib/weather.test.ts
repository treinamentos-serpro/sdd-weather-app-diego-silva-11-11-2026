import { describe, expect, it } from 'vitest';
import {
  formatForecastDate,
  formatMetric,
  formatObservationTime,
  isCurrentObservation,
} from '../../../src/lib/format';
import { formatTemperature } from '../../../src/lib/temperature';
import { getWeatherCondition } from '../../../src/lib/weatherCodes';

describe('formatação meteorológica', () => {
  it('converte a partir de Celsius e arredonda empates afastando-se de zero', () => {
    expect(formatTemperature(23, 'fahrenheit')).toBe('73 °F');
    expect(formatTemperature(0.5, 'celsius')).toBe('1 °C');
    expect(formatTemperature(-0.5, 'celsius')).toBe('-1 °C');
    expect(formatTemperature(-0.1, 'celsius')).toBe('0 °C');
    expect(formatTemperature(null, 'fahrenheit')).toBe('Indisponível');
    expect(formatTemperature(Number.NaN, 'celsius')).toBe('Indisponível');
  });

  it('mapeia todos os códigos especificados e identifica códigos desconhecidos', () => {
    const groups: [number[], string][] = [
      [[0], 'Céu limpo'],
      [[1], 'Predominantemente limpo'],
      [[2], 'Parcialmente nublado'],
      [[3], 'Nublado'],
      [[45, 48], 'Neblina'],
      [[51, 53, 55], 'Garoa'],
      [[56, 57], 'Garoa congelante'],
      [[61, 63, 65], 'Chuva'],
      [[66, 67], 'Chuva congelante'],
      [[71, 73, 75], 'Neve'],
      [[77], 'Grãos de neve'],
      [[80, 81, 82], 'Pancadas de chuva'],
      [[85, 86], 'Pancadas de neve'],
      [[95], 'Trovoada'],
      [[96, 99], 'Trovoada com granizo'],
    ];
    for (const [codes, description] of groups) {
      for (const code of codes) {
        expect(getWeatherCondition(code).description).toBe(description);
        expect(getWeatherCondition(code).icon).not.toBe('');
      }
    }
    expect(getWeatherCondition(999).description).toBe('Condição indisponível');
    expect(getWeatherCondition(null).icon).toBe('');
  });

  it('formata datas locais e métricas sem inventar valores', () => {
    expect(formatForecastDate('2026-12-31')).toMatch(/31\/12/);
    expect(formatForecastDate('2026-02-30')).toBe('Data indisponível');
    expect(formatMetric(65.5, '%', 100)).toBe('65,5 %');
    expect(formatMetric(101, '%', 100)).toBe('Indisponível');
    expect(formatMetric(-1, 'mm')).toBe('Indisponível');
    expect(formatMetric(null, 'hPa')).toBe('Indisponível');
  });

  it('valida a idade e formata o horário no fuso informado', () => {
    const now = Date.parse('2026-11-11T15:00:00Z');
    expect(isCurrentObservation('2026-11-11T13:00:00Z', now)).toBe(true);
    expect(isCurrentObservation('2026-11-11T12:59:59Z', now)).toBe(false);
    expect(isCurrentObservation('2026-11-11T15:00:01Z', now)).toBe(false);
    expect(isCurrentObservation('2026-11-11T15:00:00', now)).toBe(false);
    expect(isCurrentObservation(null, now)).toBe(false);
    expect(formatObservationTime('2026-11-11T15:00:00Z', 'America/Sao_Paulo')).toBe('12:00');
    expect(formatObservationTime('2026-11-11T15:00:00Z', 'invalido')).toBe(
      'Horário local indisponível',
    );
  });
});
