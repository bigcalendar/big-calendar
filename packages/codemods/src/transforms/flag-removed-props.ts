import type { JSXAttribute, Transform } from 'jscodeshift'

/**
 * Maps removed v1 prop names to a human-readable migration hint.
 * The hint is injected as a `// TODO: removed — …` leading comment on the
 * attribute so developers know they must act before the migration is complete.
 */
const REMOVED_PROPS: Record<string, string> = {
  popup: 'no popup overflow mode in @big-calendar/react; use `weekEventLimit` to cap visible rows',
  popupOffset: 'removed with `popup`',
  rtl: 'RTL layout is not supported in @big-calendar/react',
  onSelectSlot:
    'split into `onSlotClick` (single click), `onSlotDoubleClick`, and `onSlotSelect` (drag commit)',
  culture: 'removed — pass locale to the localizer instead',
  formats: 'removed — use localizer formatting or `messages` for string overrides',
}

const TARGET_ELEMENTS = new Set(['Calendar', 'CalendarProvider'])

const transform: Transform = (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)
  let modified = false

  root
    .find(j.JSXOpeningElement)
    .filter((path) => {
      const { name } = path.node
      return name.type === 'JSXIdentifier' && TARGET_ELEMENTS.has(name.name)
    })
    .forEach((path) => {
      ;(path.node.attributes ?? []).forEach((attr) => {
        if (
          attr.type !== 'JSXAttribute' ||
          attr.name.type !== 'JSXIdentifier' ||
          !(attr.name.name in REMOVED_PROPS)
        )
          return

        const hint = REMOVED_PROPS[(attr as JSXAttribute & { name: { name: string } }).name.name]
        const comment = {
          type: 'CommentLine' as const,
          value: ` TODO: removed — ${hint}`,
          leading: true,
          trailing: false,
        }

        const node = attr as JSXAttribute
        if (!node.comments) node.comments = []
        node.comments.unshift(comment as never)
        modified = true
      })
    })

  return modified ? root.toSource() : null
}

export const parser = 'tsx' as const
export default transform
