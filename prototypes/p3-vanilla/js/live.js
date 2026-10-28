// One polite live region per calendar (spec section 2.5). Messages are
// debounced so rapid key presses announce only where things settled, and the
// region is cleared first so a repeated message is still spoken.
export function createLiveRegion(el, { delay = 150 } = {}) {
  let timer
  return {
    announce(text) {
      clearTimeout(timer)
      timer = setTimeout(() => {
        el.textContent = ''
        requestAnimationFrame(() => (el.textContent = text))
      }, delay)
    },
  }
}
