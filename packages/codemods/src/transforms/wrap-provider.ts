import type { JSXAttribute, JSXElement, JSXSpreadAttribute, Transform } from 'jscodeshift'

/** Props that belong on `<Calendar>` in the new API; all others move to `<CalendarProvider>`. */
const CALENDAR_ONLY_PROPS = new Set(['toolbar'])

const transform: Transform = (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)
  let modified = false

  root.find(j.JSXElement).forEach((path) => {
    const opening = path.node.openingElement
    if (opening.name.type !== 'JSXIdentifier' || opening.name.name !== 'Calendar') return

    // Skip if already wrapped in CalendarProvider (idempotency guard)
    const parentNode = path.parent?.node
    if (
      parentNode?.type === 'JSXElement' &&
      parentNode.openingElement?.name?.type === 'JSXIdentifier' &&
      parentNode.openingElement.name.name === 'CalendarProvider'
    )
      return

    const allAttrs = opening.attributes as (JSXAttribute | JSXSpreadAttribute)[]

    // Partition attributes: toolbar stays on Calendar, rest move to CalendarProvider
    const calendarAttrs = allAttrs.filter(
      (a) =>
        a.type === 'JSXAttribute' &&
        a.name.type === 'JSXIdentifier' &&
        CALENDAR_ONLY_PROPS.has((a.name as { name: string }).name),
    )
    const providerAttrs = allAttrs.filter(
      (a) =>
        !(
          a.type === 'JSXAttribute' &&
          a.name.type === 'JSXIdentifier' &&
          CALENDAR_ONLY_PROPS.has((a.name as { name: string }).name)
        ),
    )

    // Build inner <Calendar {calendarAttrs} />
    const innerCalendar = j.jsxElement(
      j.jsxOpeningElement(j.jsxIdentifier('Calendar'), calendarAttrs, true),
      null,
      [],
    )

    // Build <CalendarProvider {providerAttrs}>…</CalendarProvider>
    const providerEl: JSXElement = j.jsxElement(
      j.jsxOpeningElement(j.jsxIdentifier('CalendarProvider'), providerAttrs, false),
      j.jsxClosingElement(j.jsxIdentifier('CalendarProvider')),
      [innerCalendar],
    )

    path.replace(providerEl)
    modified = true
  })

  if (!modified) return null

  // Add CalendarProvider to the @big-calendar/react import if not already present
  root
    .find(j.ImportDeclaration, { source: { value: '@big-calendar/react' } })
    .forEach((path) => {
      const specifiers = path.node.specifiers ?? []
      const alreadyImported = specifiers.some(
        (s) =>
          (s.type === 'ImportSpecifier' &&
            s.imported.type === 'Identifier' &&
            (s.imported as { name: string }).name === 'CalendarProvider') ||
          (s.type === 'ImportDefaultSpecifier' &&
            s.local?.type === 'Identifier' &&
            (s.local as { name: string }).name === 'CalendarProvider'),
      )
      if (!alreadyImported) {
        specifiers.push(j.importSpecifier(j.identifier('CalendarProvider')))
        path.node.specifiers = specifiers
      }
    })

  return root.toSource()
}

export const parser = 'tsx' as const
export default transform
