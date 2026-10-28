// Option B: no top-level await. Ready immediately when Temporal is native.
function isComplete(T) {
  return (
    typeof T?.Now?.instant === 'function' &&
    typeof T?.ZonedDateTime === 'function'
  )
}
export const temporalReady = isComplete(globalThis.Temporal)
  ? Promise.resolve()
  : import('../src/polyfill.js').then(({ Temporal }) => {
      globalThis.Temporal = Temporal
    })
