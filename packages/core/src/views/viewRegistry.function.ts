import type { ViewDefinition } from './viewRegistry.type'

/**
 * Identity helper that infers a custom view's `TModel` from its `buildModel`
 * return type, so a view-component can read the model back as the same concrete
 * type it produced. Purely a typing aid — it returns the definition unchanged.
 *
 * ```ts
 * const yearView = defineView<MyEvent>()({
 *   range: ({ localizer, date }) => ({ ... }),
 *   navigate: ({ localizer, date, direction }) => ...,
 *   label: ({ localizer, date }) => ...,
 *   buildModel: ({ days, events }) => ({ months: [...] }), // TModel inferred
 * })
 * ```
 *
 * The double-call (`defineView<MyEvent>()(definition)`) lets you fix `TEvent`/
 * `TResource` explicitly while still inferring `TModel` from `buildModel`.
 */
export function defineView<TEvent, TResource = unknown>() {
  return <TModel>(
    definition: ViewDefinition<TEvent, TResource, TModel>,
  ): ViewDefinition<TEvent, TResource, TModel> => definition
}
