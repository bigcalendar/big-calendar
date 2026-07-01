import jscodeshift from 'jscodeshift'
import { describe, expect, it } from 'vitest'
import transform, { parser } from './rename-imports'

const j = jscodeshift.withParser(parser)

function run(source: string): string | null {
  const result = transform(
    { source, path: 'test.tsx' },
    { j, jscodeshift: j, stats: () => {}, report: () => {} },
    // codeql[js/superfluous-trailing-arguments] 
    {}, 
    // jscodeshift Transform type declares options: Options as required; {} satisfies the type even though this implementation ignores it
  )
  return (result as string | null | undefined) ?? null
}

describe('rename-imports', () => {
  it('returns null when no react-big-calendar imports are present', () => {
    const source = `import React from 'react'`
    expect(run(source)).toBeNull()
  })

  describe('ImportDeclaration', () => {
    it('renames a default import', () => {
      const source = `import Calendar from 'react-big-calendar'`
      const result = run(source)
      expect(result).toContain('@big-calendar/react')
      expect(result).not.toContain('react-big-calendar')
    })

    it('renames named imports', () => {
      const source = `import { Calendar, Views } from 'react-big-calendar'`
      const result = run(source)
      expect(result).toContain('@big-calendar/react')
      expect(result).not.toContain('react-big-calendar')
    })

    it('renames a default + named import', () => {
      const source = `import Calendar, { Views, momentLocalizer } from 'react-big-calendar'`
      const result = run(source)
      expect(result).toContain('@big-calendar/react')
      expect(result).not.toContain('react-big-calendar')
    })

    it('renames a type-only import', () => {
      const source = `import type { CalendarProps } from 'react-big-calendar'`
      const result = run(source)
      expect(result).toContain('@big-calendar/react')
      expect(result).not.toContain('react-big-calendar')
    })

    it('renames all rbc imports while leaving other imports untouched', () => {
      const source = [
        `import React from 'react'`,
        `import Calendar from 'react-big-calendar'`,
        `import { Views } from 'react-big-calendar'`,
        `import 'some-other-lib'`,
      ].join('\n')
      const result = run(source)
      expect(result).toContain("from 'react'")
      expect(result).toContain("'some-other-lib'")
      expect(result).not.toContain('react-big-calendar')
    })
  })

  describe('ExportNamedDeclaration', () => {
    it('renames a named re-export', () => {
      const source = `export { Calendar, Views } from 'react-big-calendar'`
      const result = run(source)
      expect(result).toContain('@big-calendar/react')
      expect(result).not.toContain('react-big-calendar')
    })

    it('renames a type-only re-export', () => {
      const source = `export type { CalendarProps } from 'react-big-calendar'`
      const result = run(source)
      expect(result).toContain('@big-calendar/react')
      expect(result).not.toContain('react-big-calendar')
    })

    it('leaves local named exports untouched', () => {
      const source = `const x = 1\nexport { x }`
      expect(run(source)).toBeNull()
    })
  })

  describe('ExportAllDeclaration', () => {
    it('renames an export * from', () => {
      const source = `export * from 'react-big-calendar'`
      const result = run(source)
      expect(result).toContain('@big-calendar/react')
      expect(result).not.toContain('react-big-calendar')
    })
  })

  it('handles a file combining imports, named re-exports, and export *', () => {
    const source = [
      `import Calendar from 'react-big-calendar'`,
      `export { Views } from 'react-big-calendar'`,
      `export * from 'react-big-calendar'`,
    ].join('\n')
    const result = run(source)
    expect(result).not.toContain('react-big-calendar')
    const matches = result?.match(/@big-calendar\/react/g) ?? []
    expect(matches).toHaveLength(3)
  })
})
