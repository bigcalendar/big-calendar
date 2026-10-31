// @big-calendar/recurrence: shows how a module package registers a feature.
import type { Feature } from '../core/index.ts'

export interface RecurrenceOptions {
  /** How far past the visible range occurrences are expanded, for "+N more" and agenda. Default `P0D`. */
  expansionMargin?: string
}
export type RecurrenceFeature = Feature<{
  name: 'recurrence'
  optionsKey: 'recurrence'
  options: RecurrenceOptions
  state: {}
  api: {}
  requires: []
}>
export declare const recurrence: RecurrenceFeature

declare module '../core/features.ts' {
  interface FeatureRegistry {
    recurrence: RecurrenceFeature
  }
}
