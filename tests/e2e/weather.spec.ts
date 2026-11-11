import { expect, test, type Page } from '@playwright/test';

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
          time: [
            '2026-11-11',
            '2026-11-12',
            '2026-11-13',
            '2026-11-14',
            '2026-11-15',
          ],
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

  await page.getByRole('button', { name: '°F' }).click();
  await expect(currentWeather.getByText('32 °F', { exact: true })).toBeVisible();
});

test('informa quando a busca não encontra cidades', async ({ page }) => {
  await mockWeatherApi(page, {});
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill('Cidade inexistente');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByRole('status')).toContainText('Nenhuma cidade foi encontrada');
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
