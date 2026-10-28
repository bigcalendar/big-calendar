// Stand-in for @big-calendar/temporal (D-32): use a complete global Temporal,
// otherwise await the polyfill chunk and install it on globalThis.
function isComplete(T) {
  return (
    typeof T?.Now?.instant === 'function' &&
    typeof T?.ZonedDateTime === 'function'
  )
}
if (!isComplete(globalThis.Temporal)) {
  const { Temporal } = await import('./polyfill.js')
  globalThis.Temporal = Temporal
}
export const source = globalThis.Temporal.__fakePolyfill ? 'polyfill' : 'native'
