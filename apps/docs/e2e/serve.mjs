// Serves the built docs site (storybook-static) for the Playwright suite. No dependency: Node's
// http server and a handful of content types.
import { readFile, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

const root = join(import.meta.dirname, '..', 'storybook-static')
const port = Number(process.env.PORT ?? 6007)
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
}

createServer(async (request, response) => {
  const path = normalize(
    decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname),
  ).replace(/^(\.\.[/\\])+/, '')
  let file = join(root, path)
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html')
    const body = await readFile(file)
    response
      .writeHead(200, {
        'content-type': types[extname(file)] ?? 'application/octet-stream',
      })
      .end(body)
  } catch {
    response
      .writeHead(404, { 'content-type': 'text/plain' })
      .end(`Not found: ${path}`)
  }
}).listen(port, '127.0.0.1', () =>
  console.log(`docs site on http://127.0.0.1:${String(port)}`),
)
