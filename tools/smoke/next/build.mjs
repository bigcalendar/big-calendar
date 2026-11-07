// Builds the page with Turbopack (Next's default), then with webpack, and checks the prerendered
// HTML each time (support matrix: Next.js, Turbopack and webpack).
import { execFileSync } from 'node:child_process'
import { readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'

const next = createRequire(import.meta.url).resolve('next/dist/bin/next')
for (const bundler of ['turbopack', 'webpack']) {
  rmSync('.next', { recursive: true, force: true })
  execFileSync(
    process.execPath,
    [next, 'build', ...(bundler === 'webpack' ? ['--webpack'] : [])],
    {
      stdio: 'inherit',
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
    },
  )
  const html = readFileSync('.next/server/app/index.html', 'utf8')
  if (
    !html.includes(
      'big-calendar smoke: application/x-big-calendar-event+json all packages loaded',
    )
  )
    throw new Error(`Smoke check failed with ${bundler}`)
  console.log(`next (${bundler}): ok`)
}
