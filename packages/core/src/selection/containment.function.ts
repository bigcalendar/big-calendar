/**
 * Returns the subset of background events from a slot-selection payload that
 * **fully contain** the selection — i.e. the background event starts at or
 * before the selection start AND ends at or after the selection end.
 *
 * Pass the payload directly from `onSlotSelect`, `onSlotClick`, or
 * `onSlotDoubleClick`. When `selection.backgroundEvents` is absent or empty the
 * function returns `[]` without iterating.
 *
 * @example
 * ```ts
 * onSlotSelect: (selection) => {
 *   const containers = getContainingBgEvents({ selection })
 *   // containers: background events that fully wrap the selected range
 * }
 * ```
 *
 * @example Custom accessor fields
 * ```ts
 * onSlotSelect: (selection) => {
 *   const containers = getContainingBgEvents({
 *     selection,
 *     bgStartAccessor: (ev) => ev.startsAt,
 *     bgEndAccessor:   (ev) => ev.endsAt,
 *   })
 * }
 * ```
 */
export function getContainingBgEvents<TEvent>({
  selection,
  bgStartAccessor,
  bgEndAccessor,
}: {
  /** The payload received from any committed-slot callback. */
  selection: { start: string; end: string; backgroundEvents?: TEvent[] }
  /** How to read the start date from a background event. Defaults to `ev.start`. */
  bgStartAccessor?: (ev: TEvent) => string | null | undefined
  /** How to read the end date from a background event. Defaults to `ev.end`. */
  bgEndAccessor?: (ev: TEvent) => string | null | undefined
}): TEvent[] {
  const bgEvents = selection.backgroundEvents
  if (!bgEvents?.length) return []

  const getStart = bgStartAccessor ?? ((ev: TEvent) => (ev as { start?: string }).start ?? null)
  const getEnd = bgEndAccessor ?? ((ev: TEvent) => (ev as { end?: string }).end ?? null)

  return bgEvents.filter((ev) => {
    const s = getStart(ev)
    const e = getEnd(ev)
    if (s == null || e == null) return false
    // Containment: bg event must fully wrap the selection on both sides
    return s <= selection.start && e >= selection.end
  })
}
