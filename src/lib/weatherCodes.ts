interface WeatherCondition {
  description: string;
  icon: string;
}

const conditions: Record<number, WeatherCondition> = {
  0: { description: 'Céu limpo', icon: '☀️' },
  1: { description: 'Predominantemente limpo', icon: '🌤️' },
  2: { description: 'Parcialmente nublado', icon: '⛅' },
  3: { description: 'Nublado', icon: '☁️' },
  45: { description: 'Neblina', icon: '🌫️' },
  48: { description: 'Neblina', icon: '🌫️' },
  51: { description: 'Garoa', icon: '🌦️' },
  53: { description: 'Garoa', icon: '🌦️' },
  55: { description: 'Garoa', icon: '🌦️' },
  56: { description: 'Garoa congelante', icon: '🌧️' },
  57: { description: 'Garoa congelante', icon: '🌧️' },
  61: { description: 'Chuva', icon: '🌧️' },
  63: { description: 'Chuva', icon: '🌧️' },
  65: { description: 'Chuva', icon: '🌧️' },
  66: { description: 'Chuva congelante', icon: '🌧️' },
  67: { description: 'Chuva congelante', icon: '🌧️' },
  71: { description: 'Neve', icon: '🌨️' },
  73: { description: 'Neve', icon: '🌨️' },
  75: { description: 'Neve', icon: '🌨️' },
  77: { description: 'Grãos de neve', icon: '🌨️' },
  80: { description: 'Pancadas de chuva', icon: '🌦️' },
  81: { description: 'Pancadas de chuva', icon: '🌦️' },
  82: { description: 'Pancadas de chuva', icon: '🌦️' },
  85: { description: 'Pancadas de neve', icon: '🌨️' },
  86: { description: 'Pancadas de neve', icon: '🌨️' },
  95: { description: 'Trovoada', icon: '⛈️' },
  96: { description: 'Trovoada com granizo', icon: '⛈️' },
  99: { description: 'Trovoada com granizo', icon: '⛈️' },
};

export function getWeatherCondition(code: number | null): WeatherCondition {
  return code !== null && Object.hasOwn(conditions, code)
    ? conditions[code]
    : { description: 'Condição indisponível', icon: '' };
}
