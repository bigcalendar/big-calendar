import { useCalendarContext } from '../CalendarProvider'
import DefaultToolbar from '../DefaultToolbar'
import { useToolbarProps } from '../useToolbarProps'

/**
 * The calendar navigation toolbar. Resolves its props from context and renders
 * either the `components.toolbar` override or the built-in {@link DefaultToolbar}.
 * Must render inside a {@link CalendarProvider}.
 */
function Toolbar() {
  const { components } = useCalendarContext()
  const props = useToolbarProps()
  const Component = components.toolbar ?? DefaultToolbar
  return <Component {...props} />
}

export default Toolbar
