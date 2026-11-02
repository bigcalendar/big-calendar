// Core and machine types `react-ui` needs, re-exported so `react-ui` depends only on the binding and
// `styles` (architecture, D-98). Type-only, so they cost nothing at runtime or in the line budget.
export type {
  CalendarOptions,
  DateRange,
  DateString,
  DefaultViews,
  FeatureMap,
  ProcessedEvent,
  ViewDefinition,
} from '@big-calendar/core'
export type { PartName, SegmentRef } from '@big-calendar/interactions'
