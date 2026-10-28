import { temporalReady } from './temporal.js'
export { temporalReady }
export function createCalendar() {
  if (typeof globalThis.Temporal?.Now?.instant !== 'function')
    throw new Error("Temporal isn't loaded yet. Await temporalReady first.")
  return {
    ok: true,
    source: globalThis.Temporal.__fakePolyfill ? 'polyfill' : 'native',
  }
}
