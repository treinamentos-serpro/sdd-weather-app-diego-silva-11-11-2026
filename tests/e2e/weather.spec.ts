import { expect, type Page, test } from '@playwright/test';

const fixedNow = new Date('2026-11-11T15:00:00Z');
const city = {
  id: 3448439,
  name: 'São Paulo',
  admin1: 'São Paulo',
  country: 'Brasil',
  latitude: -23.55,
  longitude: -46.63,
};

async function mockWeatherApi(page: Page, geocodingResponse: object) {
  await page.clock.install({ time: fixedNow });
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      json: geocodingResponse,
    }),
  );
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      json: {
        timezone: 'America/Sao_Paulo',
        utc_offset_seconds: -10_800,
        current: {
          time: '2026-11-11T12:00',
          temperature_2m: 0,
          weather_code: 0,
          relative_humidity_2m: 70,
          wind_speed_10m: 8,
          precipitation: 0,
          pressure_msl: 1012,
        },
        daily: {
          time: ['2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15'],
          weather_code: [0, 1, 2, 3, 61],
          temperature_2m_min: [0, 1, 2, 3, 4],
          temperature_2m_max: [10, 11, 12, 13, 14],
          precipitation_probability_max: [0, 10, 20, 30, 40],
        },
      },
    }),
  );
}

async function searchAndSelectCity(page: Page) {
  await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByRole('button', { name: /São Paulo/ }).click();
}

test('busca uma cidade, mostra cinco dias e converte a temperatura', async ({ page }) => {
  await mockWeatherApi(page, { results: [city] });
  await page.goto('/');
  await searchAndSelectCity(page);

  const currentWeather = page.getByRole('region', { name: 'São Paulo' });
  const forecast = page.getByRole('region', { name: 'Previsão para 5 dias' });
  await expect(currentWeather).toBeVisible();
  await expect(forecast.getByRole('listitem')).toHaveCount(5);
  await expect(currentWeather.getByText('0 °C', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Fahrenheit' }).click();
  await expect(currentWeather.getByText('32 °F', { exact: true })).toBeVisible();
});

test('informa quando a busca não encontra cidades', async ({ page }) => {
  await mockWeatherApi(page, { results: [] });
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill('Cidade inexistente');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByRole('status')).toContainText('Nenhuma cidade foi encontrada');
});

test('valida campos vazios e com espaços sem consultar a rede', async ({ page }) => {
  let requests = 0;
  await page.route('https://geocoding-api.open-meteo.com/**', (route) => {
    requests += 1;
    return route.fulfill({ contentType: 'application/json', json: { results: [] } });
  });
  await page.goto('/');

  const search = page.getByRole('searchbox', { name: 'Nome da cidade' });
  const submit = page.getByRole('button', { name: 'Buscar' });
  await submit.click();
  await expect(page.getByRole('alert')).toHaveText('Informe o nome da cidade.');
  await search.fill('   ');
  await submit.click();

  await expect(page.getByRole('alert')).toHaveText('Informe o nome da cidade.');
  expect(requests).toBe(0);
});

test('preserva caracteres especiais na busca de uma cidade', async ({ page }) => {
  const specialCity = { ...city, name: "L'Aquila" };
  await mockWeatherApi(page, { results: [specialCity] });
  let requestedName: string | null = null;
  await page.route('https://geocoding-api.open-meteo.com/**', (route) => {
    requestedName = new URL(route.request().url()).searchParams.get('name');
    return route.fulfill({
      contentType: 'application/json',
      json: { results: [specialCity] },
    });
  });
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill(" L'Aquila ");
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByRole('button', { name: /L'Aquila/ }).click();

  await expect(page.getByRole('heading', { name: "L'Aquila" })).toBeVisible();
  expect(requestedName).toBe("L'Aquila");
});

test('exibe cinco dias e fallbacks quando a resposta meteorológica é parcial', async ({ page }) => {
  await mockWeatherApi(page, { results: [city] });
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      json: {
        timezone: 'America/Sao_Paulo',
        utc_offset_seconds: -10_800,
        current: { time: '2026-11-11T12:00' },
        daily: {
          time: ['2026-11-11', '2026-11-12', null, '2026-11-14', '2026-11-15'],
        },
      },
    }),
  );
  await page.goto('/');
  await searchAndSelectCity(page);

  const currentWeather = page.getByRole('region', { name: 'São Paulo' });
  const forecast = page.getByRole('region', { name: 'Previsão para 5 dias' });
  await expect(forecast.getByRole('listitem')).toHaveCount(5);
  await expect(forecast.getByText('Data indisponível')).toBeVisible();
  await expect(currentWeather.getByText('Condição indisponível')).toBeVisible();
  await expect(currentWeather.getByText('Indisponível').first()).toBeVisible();
  await expect(page.getByText(/NaN|undefined/)).toHaveCount(0);
});

test('mostra erro amigável offline e retry refaz a busca', async ({ page }) => {
  let offline = true;
  let requests = 0;
  await page.route('https://geocoding-api.open-meteo.com/**', (route) => {
    requests += 1;
    if (offline) return route.abort('internetdisconnected');
    return route.fulfill({
      contentType: 'application/json',
      json: { results: [city] },
    });
  });
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill('Recife');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByRole('alert')).toContainText('Verifique sua conexão e tente novamente.');
  offline = false;
  await page.getByRole('button', { name: 'Tentar novamente' }).click();

  await expect(page.getByRole('heading', { name: 'Selecione uma cidade' })).toBeVisible();
  expect(requests).toBe(2);
});

test('completa a busca e apresenta o clima em viewport mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await mockWeatherApi(page, { results: [city] });
  await page.goto('/');
  await searchAndSelectCity(page);

  const currentWeather = page.getByRole('region', { name: 'São Paulo' });
  const forecast = page.getByRole('region', { name: 'Previsão para 5 dias' });
  await expect(currentWeather).toBeVisible();
  await expect(forecast.getByRole('listitem')).toHaveCount(5);
  await expect(currentWeather.getByText('0 °C', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
