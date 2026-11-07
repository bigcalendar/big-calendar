// S0's smoke test of the docs site: the introduction page renders in every engine, on both Temporal
// paths, with no axe violations. S1 adds the month view's end-to-end and visual tests.
import { expect, expectNoAxeViolations, test } from './fixtures'

test('the introduction page renders and passes axe', async ({ page }) => {
  await page.goto('/iframe.html?viewMode=docs&id=introduction--docs')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Big Calendar' }),
  ).toBeVisible()
  await expectNoAxeViolations(page)
})

test('the polyfill projects really run without native Temporal', async ({
  page,
}, testInfo) => {
  await page.goto('/iframe.html?viewMode=docs&id=introduction--docs')
  const hasTemporal = await page.evaluate(() => 'Temporal' in globalThis)
  if (
    (testInfo.project.metadata as { deleteTemporal?: boolean }).deleteTemporal
  ) {
    expect(hasTemporal).toBe(false)
  }
})
