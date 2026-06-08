import { BUILTIN_VIEWS, Navigate } from '@big-calendar/core'
import type { BuiltinViewKey, Messages, ViewKey } from '@big-calendar/core'
import type { ToolbarProps } from '../../../components.type'

const BUILTIN = new Set<string>(BUILTIN_VIEWS)

/** A view's switcher label: the localized message for a built-in, else the raw key. */
function viewButtonLabel(messages: Messages, view: ViewKey): string {
  return BUILTIN.has(view) ? messages[view as BuiltinViewKey] : view
}

/**
 * Default navigation toolbar: a today / prev / next group, the localized view
 * label, and a view switcher. Replace it wholesale via `components.toolbar`.
 * Attaches only `@big-calendar/styles` class names — it ships no CSS.
 */
function DefaultToolbar({ label, view, views, messages, onNavigate, onView }: ToolbarProps) {
  return (
    <div className="bc-toolbar">
      <div className="bc-toolbar-group">
        <button type="button" className="bc-toolbar-today" onClick={() => onNavigate(Navigate.TODAY)}>
          {messages.today}
        </button>
        <button type="button" aria-label={messages.previous} onClick={() => onNavigate(Navigate.PREVIOUS)}>
          ‹
        </button>
        <button type="button" aria-label={messages.next} onClick={() => onNavigate(Navigate.NEXT)}>
          ›
        </button>
      </div>
      <span className="bc-toolbar-label">{label}</span>
      <div className="bc-toolbar-group">
        {views.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={option === view}
            onClick={() => onView(option)}
          >
            {viewButtonLabel(messages, option)}
          </button>
        ))}
      </div>
    </div>
  )
}

export default DefaultToolbar
