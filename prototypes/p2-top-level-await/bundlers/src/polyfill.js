// Stand-in polyfill (P4 picks the real one). The marker lets the server delay
// this chunk and lets the checks find which output file holds it.
export const Temporal = {
  __fakePolyfill: true,
  marker: 'BC_FAKE_POLYFILL_MARKER',
  Now: { instant: () => 'instant' },
  ZonedDateTime: function ZonedDateTime() {},
}
