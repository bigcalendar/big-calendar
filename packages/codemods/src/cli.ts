import { globSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
import jscodeshift from 'jscodeshift'
import type { API } from 'jscodeshift'
import flagRemovedProps from './transforms/flag-removed-props.js'
import mergeAccessors from './transforms/merge-accessors.js'
import renameCallbacks from './transforms/rename-callbacks.js'
import renameImports from './transforms/rename-imports.js'
import renameProps from './transforms/rename-props.js'
import viewsProp from './transforms/views-prop.js'
import wrapProvider from './transforms/wrap-provider.js'

const TRANSFORMS = [
  { name: 'rename-imports', fn: renameImports },
  { name: 'merge-accessors', fn: mergeAccessors },
  { name: 'rename-callbacks', fn: renameCallbacks },
  { name: 'rename-props', fn: renameProps },
  { name: 'flag-removed-props', fn: flagRemovedProps },
  { name: 'views-prop', fn: viewsProp },
  { name: 'wrap-provider', fn: wrapProvider },
] as const

const SUPPORTED_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx'])

function printHelp() {
  console.log(`
@big-calendar/codemods — migrate react-big-calendar code to @big-calendar/react

Usage:
  npx @big-calendar/codemods [options] <path|glob> [<path|glob>...]

Options:
  --dry-run    Print what would change without writing files
  --help       Show this help message

Examples:
  npx @big-calendar/codemods src/
  npx @big-calendar/codemods "src/**/*.tsx"
  npx @big-calendar/codemods --dry-run "src/**/*.{ts,tsx}"

Transforms applied (in order):
  1. rename-imports       react-big-calendar → @big-calendar/react
  2. merge-accessors      *Accessor props → accessors={{ … }}
  3. rename-callbacks     onSelectEvent → onEventClick, onDoubleClickEvent → onEventDoubleClick
  4. rename-props         resourceGroupingLayout → resourceLayout, onSelecting → onSlotSelecting
  5. flag-removed-props   Insert TODO comments for props with no equivalent
  6. views-prop           views object/string → views array + optional viewDefinitions
  7. wrap-provider        (opt-in) Wrap <Calendar> in <CalendarProvider>
`)
}

async function run(patterns: string[], dryRun: boolean) {
  // Expand glob patterns to absolute file paths
  const filePaths = patterns.flatMap((pattern) =>
    (globSync(pattern, { cwd: process.cwd() }) as string[])
      .map((f: string) => resolve(process.cwd(), f))
      .filter((f: string) => SUPPORTED_EXTENSIONS.has(extname(f))),
  )

  if (filePaths.length === 0) {
    console.log('No matching files found.')
    return
  }

  const j = jscodeshift.withParser('tsx')
  const api: API = { j, jscodeshift: j, stats: () => {}, report: () => {} }

  let modifiedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const filePath of filePaths) {
    try {
      let source = await readFile(filePath, 'utf8')
      let fileModified = false
      const appliedTransforms: string[] = []

      for (const { name, fn } of TRANSFORMS) {
        let result: string | null | undefined
        try {
          result = fn({ source, path: filePath }, api, {}) as string | null | undefined
        } catch {
          // Transform error — leave this transform's result as-is
          console.error(`  [error] ${name} failed on ${filePath}`)
          errorCount++
          continue
        }
        if (result != null && result !== source) {
          source = result
          fileModified = true
          appliedTransforms.push(name)
        }
      }

      if (fileModified) {
        const label = dryRun ? '[dry-run]' : '[modified]'
        console.log(`${label} ${filePath}`)
        if (appliedTransforms.length > 0) {
          console.log(`  Transforms: ${appliedTransforms.join(', ')}`)
        }
        if (!dryRun) {
          await writeFile(filePath, source, 'utf8')
        }
        modifiedCount++
      } else {
        skippedCount++
      }
    } catch (err) {
      console.error(`[error] Could not process ${filePath}: ${String(err)}`)
      errorCount++
    }
  }

  console.log(
    `\nDone. ${modifiedCount} file(s) ${dryRun ? 'would be modified' : 'modified'}, ${skippedCount} unchanged, ${errorCount} error(s).`,
  )
}

function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    printHelp()
    process.exit(0)
  }

  const dryRun = args.includes('--dry-run')
  const patterns = args.filter((a: string) => !a.startsWith('--'))

  if (patterns.length === 0) {
    console.error('Error: at least one path or glob is required.')
    printHelp()
    process.exit(1)
  }

  run(patterns, dryRun).catch((err) => {
    console.error('Fatal:', err)
    process.exit(1)
  })
}

main()
