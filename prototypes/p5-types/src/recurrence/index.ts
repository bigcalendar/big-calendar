// @big-calendar/recurrence: shows how a module package registers a feature and its flat props.
import type { Change, Feature, RecurringScope } from '../core/index.ts'

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
  flat: 'resolveRecurringScope'
  required: 'resolveRecurringScope'
  requires: []
}>
export declare const recurrence: RecurrenceFeature

declare module '../core/features.ts' {
  interface FeatureRegistry {
    recurrence: RecurrenceFeature
  }
  interface FlatPropRegistry<TEventMeta, TResourceMeta> {
    /**
     * Required with recurrence (D-30): the app decides the scope of every change to a series; there's
     * no built-in prompt. `false` cancels the change.
     */
    resolveRecurringScope: (
      change: Change<TEventMeta>,
    ) => RecurringScope | false | Promise<RecurringScope | false>
  }
}
