// Scalar types shared by every package. Public values are strings (date engine); Temporal stays internal.

/** An event id. Unique within `events` (duplicates get a dev warning). */
export type EventId = string | number
/** A resource id. Unique within `resources`. */
export type ResourceId = string | number
/** An event source id (D-73, D-81). */
export type SourceId = string | number

/**
 * A calendar date, `YYYY-MM-DD` (T-1, T-5). Plain `string` so JSON data needs no casts;
 * ingest validates it and reports bad values through `onDataIssue`.
 */
export type DateString = string
/**
 * An instant or wall-clock date-time: `2026-10-26T12:55:00Z`, `2026-10-26T09:00-04:00`,
 * `2026-10-26T09:00` (zone-less, T-4) or with an RFC 9557 suffix (`…[America/New_York]`).
 */
export type DateTimeString = string
/** Either form. A start and end of different forms are rejected at ingest. */
export type DateOrDateTimeString = DateString | DateTimeString
/** An IANA time zone name, such as `America/New_York`. */
export type TimeZoneName = string
/** An ISO 8601 duration, such as `PT30M` or `P1D`. */
export type DurationString = string

/** ISO weekday numbers, as Temporal uses them: 1 is Monday, 7 is Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

declare const untrustedHtmlBrand: unique symbol
/**
 * HTML from outside the app, such as ICS `X-ALT-DESC` (D-37, D-11). At runtime it's a string,
 * but its type isn't `string`, so it can't reach `innerHTML` or `dangerouslySetInnerHTML`
 * without the explicit `readUntrustedHtml` step.
 */
export interface UntrustedHtml {
  readonly [untrustedHtmlBrand]: true
}
/** Marks a raw string as untrusted HTML. */
export declare function untrustedHtml(raw: string): UntrustedHtml
/** The explicit step: returns the raw, unsanitized string for the app to sanitize. */
export declare function readUntrustedHtml(value: UntrustedHtml): string
