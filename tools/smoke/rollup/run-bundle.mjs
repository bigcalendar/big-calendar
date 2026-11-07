// Runs a built bundle and checks it printed the smoke line.
import { execFileSync } from 'node:child_process'

export function runBundle(file) {
  const output = execFileSync(process.execPath, [file], { encoding: 'utf8' })
  if (
    !output.includes(
      'big-calendar smoke: application/x-big-calendar-event+json all packages loaded',
    )
  ) {
    throw new Error(`Smoke check failed for ${file}:\n${output}`)
  }
  console.log(output.trim())
}
