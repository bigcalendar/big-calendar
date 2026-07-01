/** One day of the agenda: the day-start string and its events in time order. */
export interface AgendaDay<TEvent> {
  day: string
  events: TEvent[]
}

/**
 * The derived agenda view: a flat, chronological list of days that actually
 * have events (empty days are omitted, matching v1). Each day lists every event
 * that touches it, sorted by start.
 */
export interface AgendaViewModel<TEvent> {
  days: AgendaDay<TEvent>[]
}
