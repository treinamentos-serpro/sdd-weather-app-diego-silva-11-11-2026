import { expect, test } from '@playwright/test';

for (const width of [320, 640, 1920]) {
  test(`protótipo funciona por teclado sem transbordamento em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await expect(page.getByText(/Demonstração com dados fictícios/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
    await expect(page.getByRole('listitem')).toHaveCount(5);
    const expectedColumns = width >= 1024 ? 5 : width >= 640 ? 3 : 2;
    const columns = await page.getByRole('list').evaluate((list) => {
      return getComputedStyle(list).gridTemplateColumns.split(' ').length;
    });
    expect(columns).toBe(expectedColumns);
    const fahrenheit = page.getByRole('button', { name: '°F' });
    await fahrenheit.focus();
    await page.keyboard.press('Enter');
    await expect(fahrenheit).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('73 °F')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
}
