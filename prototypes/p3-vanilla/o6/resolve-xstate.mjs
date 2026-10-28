// Lets Node resolve the bare 'xstate' import in js/machines/ to this folder's
// copy, as the browser's import map does: node --import ./resolve-xstate.mjs …
import { register } from 'node:module'
register(
  'data:text/javascript,' +
    encodeURIComponent(`
  export async function resolve(specifier, context, next) {
    if (specifier === 'xstate') return next(${JSON.stringify(new URL('./node_modules/xstate/dist/xstate.esm.js', import.meta.url).href)}, context)
    return next(specifier, context)
  }`),
)
