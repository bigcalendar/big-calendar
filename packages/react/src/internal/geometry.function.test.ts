import { describe, expect, it } from 'vitest'
import {
  eventBoxStyle,
  nowIndicatorStyle,
  segmentStyle,
  selectionStyle,
} from './geometry.function'

describe('geometry bridge', () => {
  it('maps an event box to --bc-* fraction + z custom properties', () => {
    expect(eventBoxStyle({ top: 0.25, height: 0.5, left: 0, width: 1, zIndex: 3 })).toEqual({
      '--bc-top': 0.25,
      '--bc-height': 0.5,
      '--bc-left': 0,
      '--bc-width': 1,
      '--bc-z': 3,
    })
  })

  it('maps a segment to 1-based --bc-seg-* grid props', () => {
    expect(segmentStyle({ left: 2, span: 3, row: 1 })).toEqual({
      '--bc-seg-left': 2,
      '--bc-seg-span': 3,
      '--bc-seg-row': 1,
    })
  })

  it('maps the now-indicator to --bc-now-top', () => {
    expect(nowIndicatorStyle(0.4)).toEqual({ '--bc-now-top': 0.4 })
  })

  it('maps a selection highlight to --bc-top/--bc-height', () => {
    expect(selectionStyle({ top: 0.1, height: 0.2 })).toEqual({
      '--bc-top': 0.1,
      '--bc-height': 0.2,
    })
  })
})
