import type { CSSProperties } from 'react'
import {
  agendaRowsStyle as _agendaRowsStyle,
  dayCountStyle as _dayCountStyle,
  eventBoxStyle as _eventBoxStyle,
  monthGridStyle as _monthGridStyle,
  nowIndicatorStyle as _nowIndicatorStyle,
  segmentStyle as _segmentStyle,
  selectionStyle as _selectionStyle,
  slotCountStyle as _slotCountStyle,
  slotGroupStyle as _slotGroupStyle,
} from '@big-calendar/core/utils'

export type { CSSVars, EventBoxGeometry, SegmentGeometry, SelectionGeometry } from '@big-calendar/core/utils'

/** Narrows a `CSSVars` bag to `CSSProperties` for React `style={}` props. */
const css = (v: ReturnType<typeof _segmentStyle>): CSSProperties => v as unknown as CSSProperties

export const eventBoxStyle    = (g: Parameters<typeof _eventBoxStyle>[0]):   CSSProperties => css(_eventBoxStyle(g))
export const segmentStyle     = (g: Parameters<typeof _segmentStyle>[0]):    CSSProperties => css(_segmentStyle(g))
export const monthGridStyle   = (n: Parameters<typeof _monthGridStyle>[0]):  CSSProperties => css(_monthGridStyle(n))
export const dayCountStyle    = (n: Parameters<typeof _dayCountStyle>[0]):   CSSProperties => css(_dayCountStyle(n))
export const slotCountStyle   = (n: Parameters<typeof _slotCountStyle>[0]):  CSSProperties => css(_slotCountStyle(n))
export const slotGroupStyle   = (n: Parameters<typeof _slotGroupStyle>[0]):  CSSProperties => css(_slotGroupStyle(n))
export const agendaRowsStyle  = (n: Parameters<typeof _agendaRowsStyle>[0]): CSSProperties => css(_agendaRowsStyle(n))
export const nowIndicatorStyle= (n: Parameters<typeof _nowIndicatorStyle>[0]):CSSProperties => css(_nowIndicatorStyle(n))
export const selectionStyle   = (g: Parameters<typeof _selectionStyle>[0]):  CSSProperties => css(_selectionStyle(g))
