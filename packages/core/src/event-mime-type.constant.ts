/**
 * The MIME type an event is serialized under when it's dragged out of a calendar (D-36). Another Big
 * Calendar reads it and receives the event as `{ kind: 'fromCalendar', event }` (api.md section 2.3).
 */
export const EVENT_MIME_TYPE = 'application/x-big-calendar-event+json'
