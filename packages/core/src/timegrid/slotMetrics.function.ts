import type { LocalizerContract } from '@big-calendar/localizer'
import type { SlotMetrics } from './slotMetrics.type'

/**
 * Build the slot geometry for one day's time column from a visible window
 * (`min`/`max`), a slot `step` in minutes, and the number of slots per labelled
 * group (`timeslots`). Ports v1's `getSlotMetrics`, but returns vertical
 * positions as fractions (`0..1`) rather than percentages, and reads
 * string-in/string-out through the {@link LocalizerContract}.
 *
 * DST is absorbed by the localizer (`getSlotDate` rebuilds each slot from
 * midnight; `getDstOffset` corrects positions across a transition).
 */
export function createSlotMetrics(args: {
  localizer: LocalizerContract
  min: string
  max: string
  step?: number
  timeslots?: number
}): SlotMetrics {
  const { localizer, min, max, step = 30, timeslots = 2 } = args

  // +1 so the final moment of the window is reachable (matches v1).
  const totalMin = 1 + localizer.getTotalMin({ start: min, end: max })
  const baseMin = localizer.getMinutesFromMidnight(min)
  const numGroups = Math.ceil((totalMin - 1) / (step * timeslots))
  const numSlots = numGroups * timeslots
  const span = step * numSlots

  // Each slot is rebuilt from midnight (not added cumulatively) to avoid DST drift.
  const slots: string[] = []
  for (let slotIdx = 0; slotIdx <= numSlots; slotIdx++) {
    slots.push(localizer.getSlotDate({ date: min, minutesFromMidnight: baseMin + slotIdx * step }))
  }

  const positionFromDate = (date: string): number => {
    // Wall-clock minutes from the window start: real elapsed (`date − min`) plus
    // the DST offset delta over that span. `diff` is `a − b`, so `date` is `a`.
    const diff =
      localizer.diff({ a: date, b: min, unit: 'minute' }) +
      localizer.getDstOffset({ start: min, end: date })
    return Math.min(diff, totalMin)
  }

  return {
    min,
    max,
    step,
    timeslots,
    numSlots,
    totalMin,
    slots,

    getRange({ start, end, ignoreMin = false, ignoreMax = false }) {
      const rangeStart = ignoreMin
        ? start
        : localizer.min({ values: [max, localizer.max({ values: [min, start] })] })
      const rangeEnd = ignoreMax
        ? end
        : localizer.min({ values: [max, localizer.max({ values: [min, end] })] })

      const rangeStartMin = positionFromDate(rangeStart)
      const rangeEndMin = positionFromDate(rangeEnd)

      // A range that runs past the window (and isn't pinned to max) is nudged up
      // one step so it doesn't render flush against the bottom edge — v1 parity.
      const top =
        rangeEndMin > span && !localizer.eq({ a: max, b: rangeEnd })
          ? (rangeStartMin - step) / span
          : rangeStartMin / span

      return {
        top,
        height: rangeEndMin / span - top,
        start: rangeStartMin,
        end: rangeEndMin,
        startDate: rangeStart,
        endDate: rangeEnd,
      }
    },

    getCurrentTimePosition(date) {
      return positionFromDate(date) / span
    },
  }
}
