// Runs tsc on fail/ and checks each `// expect:` line: the next line must error, with that text.
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'

let out = ''
try {
  execFileSync('npx', ['tsc', '-p', 'fail', '--pretty', 'false'], {
    encoding: 'utf8',
  })
} catch (error) {
  out = error.stdout
}
// Group errors (with their continuation lines) by file and line.
const errors = new Map()
let key
for (const line of out.split('\n')) {
  const m = line.match(/^(fail\/[^(]+)\((\d+),\d+\): error/)
  if (m) key = `${m[1]}:${m[2]}`
  if (key) errors.set(key, (errors.get(key) ?? '') + line + '\n')
}
let failed = 0
let checked = 0
for (const file of readdirSync('fail').filter((f) => f.endsWith('.ts'))) {
  const lines = readFileSync(`fail/${file}`, 'utf8').split('\n')
  lines.forEach((text, i) => {
    const m = text.match(/\/\/ expect: (.+)$/)
    if (!m) return
    checked++
    // The case runs from the next line to the next blank line.
    let last = i + 1
    while (last + 1 < lines.length && lines[last + 1].trim() !== '') last++
    let got = ''
    for (let n = i + 2; n <= last + 1; n++) {
      const k = `fail/${file}:${n}`
      if (errors.has(k)) {
        got += errors.get(k)
        errors.delete(k)
      }
    }
    if (!got.includes(m[1])) {
      failed++
      console.log(
        `✗ fail/${file}:${i + 2} expected "${m[1]}"\n  ${got ? got.trim().replaceAll('\n', '\n  ') : '(no error)'}`,
      )
    }
  })
}
for (const [k, text] of errors) {
  failed++
  console.log(`✗ ${k} unexpected error\n  ${text.trim()}`)
}
console.log(
  `${checked - failed >= 0 ? checked : 0} expectations, ${failed} problems`,
)
process.exitCode = failed ? 1 : 0
