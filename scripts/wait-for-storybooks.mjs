/**
 * Orchestrates the full Storybook dev environment in the correct order:
 *   1. Spawn the react slave   (port 6006) and wait for it to finish compiling.
 *   2. Spawn the vue slave     (port 6008) once react is ready.
 *   3. Spawn the angular slave (port 6009) once vue is ready.
 *   4. Spawn the core hub      (port 6007) once all slaves are ready.
 *
 * The hub reads its refs at startup — if the slaves aren't already serving
 * /index.json when the hub initialises, the ref panel shows an error.
 * Sequential startup avoids that race entirely.
 */
import { spawn }   from 'node:child_process'
import { get }     from 'node:http'
import { exec }    from 'node:child_process'
import { resolve } from 'node:path'

const ROOT    = resolve(import.meta.dirname, '..')
const POLL_MS = 2000
const HUB_URL = 'http://localhost:6007'

const waitForIndex = (url) =>
  new Promise((resolve) => {
    const attempt = () =>
      get(url, (res) => {
        if (res.statusCode !== 200) { setTimeout(attempt, POLL_MS); return }
        let body = ''
        res.on('data', (c) => (body += c))
        res.on('end', () => {
          try { JSON.parse(body); resolve() }
          catch { setTimeout(attempt, POLL_MS) }
        })
      }).on('error', () => setTimeout(attempt, POLL_MS))
    attempt()
  })

const spawnStorybook = (pkg, port) => {
  const proc = spawn(
    'pnpm', ['exec', 'storybook', 'dev', '-p', String(port), '--no-open'],
    { cwd: resolve(ROOT, 'packages', pkg), stdio: 'inherit' },
  )
  proc.on('error', (err) => { console.error(`  storybook ${pkg} error:`, err); process.exit(1) })
  return proc
}

const spawnAngularStorybook = () => {
  const proc = spawn(
    'pnpm', ['exec', 'ng', 'run', 'angular:storybook'],
    { cwd: resolve(ROOT, 'packages', 'angular'), stdio: 'inherit' },
  )
  proc.on('error', (err) => { console.error('  storybook angular error:', err); process.exit(1) })
  return proc
}

const openBrowser = () => {
  const cmd =
    process.platform === 'darwin' ? `open "${HUB_URL}"` :
    process.platform === 'win32'  ? `start "" "${HUB_URL}"` :
                                    `xdg-open "${HUB_URL}"`
  exec(cmd)
}

// ── Step 1: react slave ──────────────────────────────────────────────────────
console.log('\n  [1/4] Starting react slave on port 6006...')
const reactProc = spawnStorybook('react', 6006)
await waitForIndex('http://localhost:6006/index.json')
console.log('        React ready.\n')

// ── Step 2: vue slave ────────────────────────────────────────────────────────
console.log('  [2/4] Starting vue slave on port 6008...')
const vueProc = spawnStorybook('vue', 6008)
await waitForIndex('http://localhost:6008/index.json')
console.log('        Vue ready.\n')

// ── Step 3: angular slave ────────────────────────────────────────────────────
console.log('  [3/4] Starting angular slave on port 6009...')
const angularProc = spawnAngularStorybook()
await waitForIndex('http://localhost:6009/index.json')
console.log('        Angular ready.\n')

// ── Step 4: core hub ─────────────────────────────────────────────────────────
console.log('  [4/4] Starting core hub on port 6007...')
const coreProc = spawnStorybook('core', 6007)
await waitForIndex('http://localhost:6007/index.json')
console.log('        Core hub ready.\n')

// ── Open browser ─────────────────────────────────────────────────────────────
openBrowser()
console.log(`  Hub open at ${HUB_URL}\n`)

// Keep the script alive so all child processes stay up, and clean up on exit.
const shutdown = () => { reactProc.kill(); vueProc.kill(); angularProc.kill(); coreProc.kill(); process.exit(0) }
process.on('SIGINT',  shutdown)
process.on('SIGTERM', shutdown)
