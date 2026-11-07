// The browser suite (D-42, D-48): end to end, visual and axe on Chromium, Firefox and WebKit. Each
// engine runs twice: as is, and with `globalThis.Temporal` deleted so the polyfill path is always
// tested (D-87). Touch emulation joins with the first interactive views (S1).
import { defineConfig, devices } from '@playwright/test'

const engines = [
  { name: 'chromium', device: devices['Desktop Chrome'] },
  { name: 'firefox', device: devices['Desktop Firefox'] },
  { name: 'webkit', device: devices['Desktop Safari'] },
]

export default defineConfig({
  testDir: '.',
  outputDir: '../../../test-results/docs-e2e',
  reporter: process.env['CI']
    ? [
        ['github'],
        ['html', { open: 'never', outputFolder: '../../../playwright-report' }],
      ]
    : 'list',
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 1 : 0,
  use: { baseURL: 'http://127.0.0.1:6007', trace: 'on-first-retry' },
  webServer: {
    command: 'node e2e/serve.mjs',
    cwd: '..',
    url: 'http://127.0.0.1:6007/index.html',
    reuseExistingServer: !process.env['CI'],
  },
  projects: engines.flatMap(({ name, device }) => [
    { name, use: { ...device }, metadata: { deleteTemporal: false } },
    {
      name: `${name}-polyfill`,
      use: { ...device },
      metadata: { deleteTemporal: true },
    },
  ]),
})
