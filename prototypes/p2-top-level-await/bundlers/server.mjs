// Serves dist/, delays the polyfill chunk to widen the race, and collects reports.
import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync, appendFileSync } from 'node:fs'
import { join, extname, resolve } from 'node:path'

const dist = resolve(import.meta.dirname, 'dist')
const port = Number(process.env.PORT ?? 4517)
const log = resolve(import.meta.dirname, process.env.RESULTS ?? 'results.jsonl')
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
}
const delayMs = Number(process.env.POLYFILL_DELAY ?? 150)
const builds = ['unbundled', 'vite', 'rollup', 'esbuild', 'webpack', 'rspack']
const scenarios = ['static', 'concurrent', 'mixed', 'many', 'late']
const repeats = Number(process.env.REPEATS ?? 5)
const plan = []
const nextBuilds =
  (process.env.NEXT ?? '1') === '1' ? ['next-turbopack', 'next-webpack'] : []
for (let r = 0; r < repeats; r++) {
  for (const b of process.env.ONLY_NEXT ? [] : builds)
    for (const s of scenarios) plan.push([b, s])
  for (const b of nextBuilds)
    for (const s of ['static', 'concurrent', 'many']) plan.push([b, s])
}
const reported = new Set()
let current = -1
function record(r) {
  appendFileSync(
    log,
    JSON.stringify({ tag: process.env.TAG ?? '', seq: current, ...r }) + '\n',
  )
}

createServer((req, res) => {
  const url = new URL(req.url, 'http://x')
  if (req.method === 'POST' && url.pathname === '/report') {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      const r = JSON.parse(body)
      if (r.scenario !== 'unhandledrejection') reported.add(current)
      record(r)
      res.end('ok')
    })
    return
  }
  // Sequential mode: /seq/<i> is the i-th (build, scenario) as a top-level page.
  const seq = url.pathname.match(/^\/seq\/(\d+)$/)
  if (seq) {
    const i = Number(seq[1])
    if (i > 0 && !reported.has(i - 1))
      record({
        scenario: plan[i - 1]?.[1],
        build: plan[i - 1]?.[0],
        ok: false,
        error: 'timeout: page never reported',
      })
    current = i
    if (i >= plan.length) {
      record({ scenario: 'FINISHED', build: '-', ok: true })
      res.writeHead(200, { 'content-type': 'text/html' }).end('<p>FINISHED</p>')
      return
    }
    const [build, scenario] = plan[i]
    const page = readFileSync(join(dist, build, `${scenario}.html`), 'utf8')
      .replace(/<html/, `<html data-next="/seq/${i + 1}"`)
      .replace(
        /<head>/,
        `<head>${build.startsWith('next') ? '' : `<base href="/${build}/">`}<meta http-equiv="refresh" content="6;url=/seq/${i + 1}">`,
      )
    res.writeHead(200, {
      'content-type': 'text/html',
      'cache-control': 'no-store',
    })
    res.end(page)
    return
  }
  const file = join(dist, url.pathname === '/' ? 'runner.html' : url.pathname)
  if (
    !file.startsWith(dist) ||
    !existsSync(file) ||
    statSync(file).isDirectory()
  ) {
    res.writeHead(404).end()
    return
  }
  const body = readFileSync(file)
  const send = () => {
    res.writeHead(200, {
      'content-type': types[extname(file)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    })
    res.end(body)
  }
  if (body.includes('BC_FAKE_POLYFILL_MARKER')) setTimeout(send, delayMs)
  else send()
}).listen(port, () => console.log(`http://localhost:${port}/`))
