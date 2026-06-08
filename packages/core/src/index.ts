export const PACKAGE_NAME = '@big-calendar/core'

// Re-exported because the store's public surface (`store.localizer`) is typed as
// it; adapters need the type without depending on `@big-calendar/localizer`.
export type { LocalizerContract } from '@big-calendar/localizer'

export { BUILTIN_VIEWS, Navigate, Views } from './constants/views.constant'
export type { BuiltinViewKey, NavigateDirection } from './constants/views.constant'

export type { EventId, ResourceId, ViewKey, VisibleRange } from './types/calendar.type'

export {
  accessor,
  DEFAULT_ACCESSORS,
  resolveAccessors,
  wrapAccessor,
} from './accessors/accessors.function'
export type { Accessor, AccessorFn, Accessors, WrappedAccessor } from './accessors/accessors.type'

export {
  DEFAULT_DAY_LAYOUT_ALGORITHMS,
  resolveDayLayoutAlgorithm,
} from './layout/dayLayout.function'
export { noOverlap } from './layout/noOverlap.function'
export { overlap } from './layout/overlap.function'
export type {
  DayLayoutAlgorithm,
  DayLayoutAlgorithmKey,
  DayLayoutArgs,
  DayLayoutBox,
  DayLayoutEvent,
} from './layout/layout.type'

export { DEFAULT_MESSAGES, resolveMessages } from './messages/messages.function'
export type { Messages } from './messages/messages.type'

export { createSelection } from './selection/selection.function'
export type { SelectionController } from './selection/selection.function'
export { moveEvent } from './dnd/moveEvent.function'
export type { MoveEventArgs, MovedEvent, MoveMode } from './dnd/moveEvent.function'
export { resizeEvent } from './dnd/resizeEvent.function'
export type { ResizeEdge, ResizeEventArgs, ResizedEvent } from './dnd/resizeEvent.function'
export type {
  SelectableMode,
  SelectAction,
  SelectionMode,
  SelectionRange,
  SelectionState,
  SlotSelection,
  SlotSelectionDates,
} from './selection/selection.type'

export { agendaViewModel } from './views/agenda.function'
export type { AgendaDay, AgendaViewModel } from './views/agenda.type'
export { groupEventsByResource } from './resources/resources.function'
export type { ResourceGroup } from './resources/resources.type'

export { monthViewModel } from './views/month.function'
export type { MonthSegment, MonthViewModel, MonthWeek } from './views/month.type'
export { buildViewModel } from './views/viewModel.function'
export type { CalendarViewModel, ViewModelOptions } from './views/viewModel.type'
export { defineView } from './views/viewRegistry.function'
export type {
  ViewBuildModelArgs,
  ViewDefinition,
  ViewLabelArgs as ViewDefinitionLabelArgs,
  ViewNavigateArgs,
  ViewRangeArgs,
  ViewRegistry,
  ViewRegistrySeams,
} from './views/viewRegistry.type'
export { datedEvents, rowSegments } from './views/segments.function'
export type { DatedEvent } from './views/segments.function'
export type { EventSegment, SegmentRows } from './views/segments.type'

export { createSlotMetrics } from './timegrid/slotMetrics.function'
export type { SlotMetrics, SlotRange } from './timegrid/slotMetrics.type'
export { timeGridViewModel } from './timegrid/timeGrid.function'
export type {
  PositionedEvent,
  TimeGridColumn,
  TimeGridViewModel,
} from './timegrid/timeGrid.type'

export { createCalendarStore } from './store/createCalendarStore.function'
export { resolveDrilldownView } from './store/drilldown.function'
export type { GetDrilldownView } from './store/drilldown.function'
export { navigateDate } from './store/navigateDate.function'
export { viewRange } from './store/viewRange.function'
export { viewLabel } from './store/viewLabel.function'
export type { ViewLabelArgs } from './store/viewLabel.function'
export type { CalendarStore, EventHandlerApi, SelectionApi } from './store/store.type'
export type { CalendarConfig } from './types/config.type'
