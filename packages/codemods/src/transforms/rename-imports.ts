import type { Transform } from 'jscodeshift'

const OLD = 'react-big-calendar'
const NEW = '@big-calendar/react'

const transform: Transform = (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)
  let modified = false

  root.find(j.ImportDeclaration, { source: { value: OLD } }).forEach((path) => {
    path.node.source.value = NEW
    modified = true
  })

  root
    .find(j.ExportNamedDeclaration, { source: { value: OLD } })
    .forEach((path) => {
      path.node.source!.value = NEW
      modified = true
    })

  root
    .find(j.ExportAllDeclaration, { source: { value: OLD } })
    .forEach((path) => {
      path.node.source.value = NEW
      modified = true
    })

  return modified ? root.toSource() : null
}

export const parser = 'tsx' as const
export default transform
