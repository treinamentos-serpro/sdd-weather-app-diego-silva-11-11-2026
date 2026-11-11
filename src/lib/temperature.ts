import type { Unit } from '../types/weather';

export function formatTemperature(value: number | null, unit: Unit): string {
  if (value === null || !Number.isFinite(value)) return 'Indisponível';
  const converted = unit === 'fahrenheit' ? (value * 9) / 5 + 32 : value;
  if (!Number.isFinite(converted)) return 'Indisponível';
  const rounded = Math.sign(converted) * Math.round(Math.abs(converted));
  return `${rounded === 0 ? 0 : rounded} °${unit === 'celsius' ? 'C' : 'F'}`;
}
