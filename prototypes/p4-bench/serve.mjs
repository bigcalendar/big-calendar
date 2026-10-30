// Tiny static server for the P4 pages. `node serve.mjs` serves this folder on port 4900;
// importing it from a script starts it on a free port and returns the URL.
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const root = import.meta.dirname
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }

export function serve(port = 0, host = '127.0.0.1') {
  const server = createServer(async (req, res) => {
    // Pages that run on real devices post their results here; they land in reports/.
    if (req.method === 'POST' && req.url.startsWith('/report/')) {
      const name = req.url.slice(8).replace(/[^\w.-]/g, '_')
      let body = ''
      for await (const chunk of req) body += chunk
      await mkdir(join(root, 'reports'), { recursive: true })
      await writeFile(join(root, 'reports', `${name}.json`), body)
      res.writeHead(204).end()
      console.log(`report saved: reports/${name}.json`)
      return
    }
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '')
    const file = join(root, path.endsWith('/') ? `${path}index.html` : path)
    try {
      const body = await readFile(file)
      res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' })
      res.end(body)
    } catch {
      res.writeHead(404).end()
    }
  })
  return new Promise((ok) => server.listen(port, host, () => ok({ url: `http://${host === '0.0.0.0' ? 'localhost' : host}:${server.address().port}`, close: () => server.close() })))
}

if (import.meta.main ?? process.argv[1] === import.meta.filename) {
  // `--lan` also serves the pages to phones on the same network (for the touch checks).
  const lan = process.argv.includes('--lan')
  const { url } = await serve(4900, lan ? '0.0.0.0' : '127.0.0.1')
  console.log(`P4 pages on ${url}`)
  if (lan) {
    const { networkInterfaces } = await import('node:os')
    for (const a of Object.values(networkInterfaces()).flat()) if (a.family === 'IPv4' && !a.internal) console.log(`  on your network: http://${a.address}:4900`)
  }
}
