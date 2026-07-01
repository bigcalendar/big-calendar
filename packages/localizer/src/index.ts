export const PACKAGE_NAME = '@big-calendar/localizer'

export { Localizer } from './localizer.class'
export { DEFAULT_FORMATS } from './constants/formats.constant'
export { getWeekInfo } from './ponyfills/weekInfo.function'
export type { WeekInfo } from './ponyfills/weekInfo.function'
export { formatDuration } from './ponyfills/durationFormat.function'
export type { DurationParts, DurationStyle } from './ponyfills/durationFormat.function'

export type {
  CompareArgs,
  DateParts,
  DateRange,
  DateTimeUnit,
  FixedUnit,
  FormatInput,
  FormatKey,
  FormatMap,
  LocalizerContract,
  LocalizerOptions,
  TimeParts,
} from './types/localizer.type'
