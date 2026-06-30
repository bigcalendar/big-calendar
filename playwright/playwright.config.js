import { defineConfig, devices } from '@playwright/test'

const WORKERS = parseInt(process.env.PLAYWRIGHT_WORKERS ?? '1', 10)

export default defineConfig({
  testDir: './tests',
  workers: WORKERS,
  fullyParallel: false,
  timeout: 45_000,
  maxFailures: 5,
  expect: {
    timeout: 10_000,
    // Allow up to 0.2% pixel difference for anti-aliasing / sub-pixel rendering
    toHaveScreenshot: { maxDiffPixelRatio: 0.002 },
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: '../playwright-report', open: 'never' }],
  ],

  use: {
    headless: true,
    viewport: { width: 1280, height: 900 },
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    launchOptions: {
      args: [
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--renderer-process-limit=1',
        '--disable-background-timer-throttling',
        '--js-flags=--max-old-space-size=256',
        '--disable-site-isolation-trials',
      ],
    },
  },

  projects: [
    {
      name: 'react',
      use: {
        channel: 'chromium',
        baseURL: 'http://localhost:6006',
      },
      testMatch: '**/react-*.spec.js',
    },
    {
      name: 'vue',
      use: {
        channel: 'chromium',
        baseURL: 'http://localhost:6008',
      },
      testMatch: '**/vue-*.spec.js',
    },
    {
      name: 'compare',
      use: { channel: 'chromium' },
      testMatch: '**/compare-*.spec.js',
    },
  ],

  webServer: [
    {
      command: 'pnpm exec nx run react:storybook',
      url: 'http://localhost:6006',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'pnpm exec nx run vue:storybook',
      url: 'http://localhost:6008',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
})
