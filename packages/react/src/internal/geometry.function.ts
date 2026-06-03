import type { CSSProperties } from 'react'

/**
 * The core → CSS geometry bridge. `core` emits normalized numbers; these helpers
 * turn them into the inline `--bc-*` custom properties documented in
 * `@big-calendar/styles` (VOCABULARY.md → "Geometry contract"). Components attach
 * the matching `.bc-*` class and spread one of these onto the element's `style`;
 * the stylesheet does the actual placement. Framework packages ship no CSS.
 */

/**
 * `CSSProperties` with CSS custom properties allowed. `csstype` (React's style
 * type) rejects arbitrary `--*` keys; this intersection re-permits them while
 * staying assignable to `CSSProperties`.
 */
type StyleWithVars = CSSProperties & Record<`--${string}`, string | number>

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
export function eventBoxStyle({ top, height, left, width, zIndex }: EventBoxGeometry): CSSProperties {
  const style: StyleWithVars = {
    '--bc-top': top,
    '--bc-height': height,
    '--bc-left': left,
    '--bc-width': width,
    '--bc-z': zIndex,
  }
  return style
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
export function segmentStyle({ left, span, row }: SegmentGeometry): CSSProperties {
  const style: StyleWithVars = {
    '--bc-seg-left': left,
    '--bc-seg-span': span,
    '--bc-seg-row': row,
  }
  return style
}

/** Inline custom property for the `.bc-month-grid` container: how many week rows it holds. */
export function monthGridStyle(weekCount: number): CSSProperties {
  const style: StyleWithVars = { '--bc-week-count': weekCount }
  return style
}

/** Inline custom property for the `.bc-now-indicator` line, fraction `0..1` down the column. */
export function nowIndicatorStyle(top: number): CSSProperties {
  const style: StyleWithVars = { '--bc-now-top': top }
  return style
}

/** A drag-selection highlight spanning part of a day column, as fractions `0..1`. */
export interface SelectionGeometry {
  top: number
  height: number
}

/** Inline custom properties for a `.bc-selection` overlay. */
export function selectionStyle({ top, height }: SelectionGeometry): CSSProperties {
  const style: StyleWithVars = {
    '--bc-top': top,
    '--bc-height': height,
  }
  return style
}
