// Stand-ins for the @big-calendar/react-ui runtime the slices haven't written yet, typed against the
// real package (D-99). Remove each one when its slice implements it.
import type { ReactNode } from 'react'
import type {
  DefaultViews,
  FeatureMap,
  ViewDefinition,
} from '@big-calendar/react'
import type { CalendarProps } from '@big-calendar/react-ui'

export * from '@big-calendar/react-ui'

/** The drop-in calendar (api.md section 3.3). */
export declare function Calendar<
  const F extends FeatureMap,
  const V extends Record<string, ViewDefinition<string>> = DefaultViews<F>,
  TEventMeta = unknown,
  TResourceMeta = unknown,
>(props: CalendarProps<F, V, TEventMeta, TResourceMeta>): ReactNode
