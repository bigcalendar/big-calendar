// O-6 measurements: lines of machine code and bundle cost of each candidate.
import { build } from 'esbuild'
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

function loc(file, { from, to } = {}) {
  let lines = readFileSync(file, 'utf8').split('\n')
  if (from) lines = lines.slice(lines.findIndex((l) => l.includes(from)))
  if (to)
    lines = lines.slice(
      0,
      lines.findIndex((l) => l.includes(to)),
    )
  return lines.filter(
    (l) =>
      l.trim() &&
      !l.trim().startsWith('//') &&
      !l.trim().startsWith('*') &&
      !l.trim().startsWith('/*'),
  ).length
}
async function size(entry) {
  const r = await build({
    entryPoints: [entry],
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    alias: { xstate: './node_modules/xstate/dist/xstate.esm.js' },
    logLevel: 'silent',
  })
  const code = r.outputFiles[0].contents
  return { min: code.length, gzip: gzipSync(code).length }
}
const hand = await size('../js/machines/move-fsm.js')
const xs = await size('../js/machines/move-xstate.js')
console.log(
  JSON.stringify(
    {
      loc: {
        handMachine: loc('../js/machines/move-fsm.js', {
          to: 'export function step',
        }),
        sharedStep: loc('../js/machines/move-fsm.js', {
          from: 'export function step',
        }),
        xstateMachine: loc('../js/machines/move-xstate.js'),
      },
      bytes: {
        hand,
        xstate: xs,
        xstateAdds: { min: xs.min - hand.min, gzip: xs.gzip - hand.gzip },
      },
    },
    null,
    2,
  ),
)
