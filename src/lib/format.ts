export function formatForecastDate(date: string | null): string {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Data indisponível';
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    return 'Data indisponível';
  }
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(parsed);
}

export function formatMetric(
  value: number | null,
  unit: string,
  maximum = Number.POSITIVE_INFINITY,
): string {
  if (value === null || !Number.isFinite(value) || value < 0 || value > maximum) {
    return 'Indisponível';
  }
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value)} ${unit}`;
}

export function formatObservationTime(observedAt: string, timezone: string | null): string {
  if (!timezone) return 'Horário local indisponível';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(observedAt));
  } catch (error) {
    if (error instanceof RangeError) return 'Horário local indisponível';
    throw error;
  }
}

export function isCurrentObservation(observedAt: string | null, now = Date.now()): boolean {
  if (!observedAt || !/(?:Z|[+-]\d{2}:\d{2})$/i.test(observedAt)) return false;
  const time = Date.parse(observedAt);
  return Number.isFinite(time) && time <= now && now - time <= 2 * 60 * 60 * 1000;
}
