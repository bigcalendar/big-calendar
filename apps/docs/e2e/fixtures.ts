// Shared fixtures for the browser suite: the polyfill projects delete `globalThis.Temporal` before
// any page script runs (D-87), and `expectNoAxeViolations` runs axe on the page (D-42).
import AxeBuilder from '@axe-core/playwright'
import { expect, test as base, type Page } from '@playwright/test'

export const test = base.extend({
  context: async ({ context }, use, testInfo) => {
    if (
      (testInfo.project.metadata as { deleteTemporal?: boolean }).deleteTemporal
    ) {
      await context.addInitScript(() => {
        delete (globalThis as { Temporal?: unknown }).Temporal
      })
    }
    await use(context)
  },
})

export { expect }

/** Fails the test on any axe violation, listing each one (D-42: zero violations). */
export async function expectNoAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze()
  const violations = results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help} (${String(violation.nodes.length)})`,
  )
  expect(violations).toEqual([])
}
