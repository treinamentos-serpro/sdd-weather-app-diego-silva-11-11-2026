import { describe, expect, it } from 'vitest';
import {
  formatForecastDate,
  formatMetric,
  formatObservationTime,
  isCurrentObservation,
} from '../../../src/lib/format';

describe('formatação de dados meteorológicos', () => {
  it('formata datas de previsão no calendário local e recusa datas inválidas', () => {
    expect(formatForecastDate('2026-11-11')).toContain('11/11');
    expect(formatForecastDate('2026-02-30')).toBe('Data indisponível');
    expect(formatForecastDate('11/11/2026')).toBe('Data indisponível');
    expect(formatForecastDate(null)).toBe('Data indisponível');
  });

  it('formata métricas válidas e identifica valores ausentes ou fora dos limites', () => {
    expect(formatMetric(65.5, '%', 100)).toBe('65,5 %');
    expect(formatMetric(null, 'mm')).toBe('Indisponível');
    expect(formatMetric(-1, 'km/h')).toBe('Indisponível');
    expect(formatMetric(101, '%', 100)).toBe('Indisponível');
  });

  it('formata horário no fuso informado e valida a atualidade da observação', () => {
    const now = Date.parse('2026-11-11T15:00:00Z');
    expect(formatObservationTime('2026-11-11T15:00:00Z', 'America/Sao_Paulo')).toBe('12:00');
    expect(formatObservationTime('2026-11-11T15:00:00Z', null)).toBe('Horário local indisponível');
    expect(isCurrentObservation('2026-11-11T14:00:00Z', now)).toBe(true);
    expect(isCurrentObservation('2026-11-11T12:59:59Z', now)).toBe(false);
    expect(isCurrentObservation('2026-11-11T15:00:01Z', now)).toBe(false);
  });
});
