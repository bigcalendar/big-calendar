/**
 * The core → CSS geometry bridge. `core` emits normalized numbers; these helpers
 * turn them into the inline `--bc-*` custom properties documented in
 * `@big-calendar/styles` (VOCABULARY.md → "Geometry contract"). Components attach
 * the matching `.bc-*` class and spread one of these onto the element's `style`;
 * the stylesheet does the actual placement. Framework packages ship no CSS.
 */

/**
 * A set of CSS custom-property declarations for inline `style` spreads.
 * Assignable to `React.CSSProperties` (cast as needed) and equivalent
 * bindings in Vue / Angular / Lit.
 */
export type CSSVars = Readonly<Record<`--${string}`, string | number>>

/** Internal helper — build the custom-property bag without a React import. */
function vars(entries: Record<`--${string}`, string | number>): CSSVars {
  return entries
}

/** A box placed within a day column, as fractions `0..1`, plus paint order. */
export interface EventBoxGeometry {
  /** Distance from the column top, fraction `0..1` (slot metrics). */
  top: number
  /** Box height, fraction `0..1` (slot metrics). */
  height: number
  /** Inline-start offset, fraction `0..1` (day-layout algorithm). */
  left: number
  /** Box width, fraction `0..1` (day-layout algorithm). */
  width: number
  /** Integer paint order. */
  zIndex: number
}

/** Inline custom properties for a `.bc-event` / `.bc-bg-event` box. */
export function eventBoxStyle({ top, height, left, width, zIndex }: EventBoxGeometry): CSSVars {
  return vars({
    '--bc-top': top,
    '--bc-height': height,
    '--bc-left': left,
    '--bc-width': width,
    '--bc-z': zIndex,
  })
}

/** A month / all-day segment placed across day columns. */
export interface SegmentGeometry {
  /** 1-based start column. */
  left: number
  /** Number of columns spanned. */
  span: number
  /** 1-based stack level (row within the week / all-day row). */
  row: number
}

/** Inline custom properties for a `.bc-segment`. */
export function segmentStyle({ left, span, row }: SegmentGeometry): CSSVars {
  return vars({
    '--bc-seg-left': left,
    '--bc-seg-span': span,
    '--bc-seg-row': row,
  })
}

/** Inline custom property for the `.bc-month-grid` container: how many week rows it holds. */
export function monthGridStyle(weekCount: number): CSSVars {
  return vars({ '--bc-week-count': weekCount })
}

/** Inline custom property for time-grid containers (`.bc-time-header`, `.bc-allday-segments`): how many day columns. */
export function dayCountStyle(dayCount: number): CSSVars {
  return vars({ '--bc-day-count': dayCount })
}

/** Inline custom property for the `.bc-time-body`: how many slot rows tall it is. */
export function slotCountStyle(slotCount: number): CSSVars {
  return vars({ '--bc-slot-count': slotCount })
}

/** Inline custom property for the `.bc-time-gutter`: how many slot rows each labelled group spans. */
export function slotGroupStyle(slotsPerGroup: number): CSSVars {
  return vars({ '--bc-slots-per-group': slotsPerGroup })
}

/** Inline custom property for a `.bc-agenda-day`: how many event rows it holds (so the date cell can span them). */
export function agendaRowsStyle(rowCount: number): CSSVars {
  return vars({ '--bc-agenda-rows': rowCount })
}

/** Inline custom property for the `.bc-now-indicator` line, fraction `0..1` down the column. */
export function nowIndicatorStyle(top: number): CSSVars {
  return vars({ '--bc-now-top': top })
}

/** A drag-selection highlight spanning part of a day column, as fractions `0..1`. */
export interface SelectionGeometry {
  top: number
  height: number
}

/** Inline custom properties for a `.bc-selection` overlay. */
export function selectionStyle({ top, height }: SelectionGeometry): CSSVars {
  return vars({
    '--bc-top': top,
    '--bc-height': height,
  })
}
