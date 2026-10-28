// Static server for the P3 prototype: node serve.mjs [port]
import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, extname, resolve } from 'node:path'

const root = resolve(import.meta.dirname)
const port = Number(process.argv[2] ?? 4800)
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
}
createServer((req, res) => {
  const path = new URL(req.url, 'http://x').pathname
  const file = join(root, path === '/' ? 'index.html' : path)
  if (
    !file.startsWith(root) ||
    !existsSync(file) ||
    statSync(file).isDirectory()
  ) {
    res.writeHead(404).end()
    return
  }
  res.writeHead(200, {
    'content-type': types[extname(file)] ?? 'text/plain',
    'cache-control': 'no-store',
  })
  res.end(readFileSync(file))
}).listen(port, '0.0.0.0', () => console.log(`http://localhost:${port}/`))
