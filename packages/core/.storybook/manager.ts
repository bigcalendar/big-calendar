import { addons } from 'storybook/manager-api'

/**
 * Ensures toolbar globalTypes (localizer / locale / timeZone) reach the manager
 * on hard reload at a ref story URL.
 *
 * Root cause: in Storybook composition mode, FramesRenderer replaces
 * `storybook-preview-iframe` with the ref's URL whenever a ref story is selected.
 * If that selection is present in the URL on the very first render (i.e. a hard
 * reload), the hub's own preview.ts — which sends SET_GLOBALS with globalTypes —
 * is never loaded, so the toolbar stays empty.
 *
 * Fix: wait 300 ms for a normal SET_GLOBALS to arrive. If globalTypes is still
 * empty, inject a temporary hidden iframe that loads the hub's own /iframe.html.
 * That preview sends SET_GLOBALS from the same origin (localhost:6007), which the
 * manager accepts as a "local" event and uses to populate globalTypes. Once the
 * toolbar buttons appear, the iframe is removed.
 */
addons.register('bc-hub-preview-init', (api) => {
  setTimeout(() => {
    if (Object.keys(api.getGlobalTypes()).length > 0) return

    if (document.getElementById('__bc-hub-init__')) return

    const iframe = document.createElement('iframe')
    iframe.id = '__bc-hub-init__'
    iframe.setAttribute('data-is-storybook', 'false')
    iframe.style.cssText = 'display:none;position:absolute;left:-9999px;width:0;height:0;'
    iframe.src = `${window.location.origin}/iframe.html`
    document.body.appendChild(iframe)

    let pollId: ReturnType<typeof setInterval> | undefined
    const cleanup = () => {
      if (pollId != null) clearInterval(pollId)
      document.getElementById('__bc-hub-init__')?.remove()
    }

    pollId = setInterval(() => {
      if (Object.keys(api.getGlobalTypes()).length > 0) cleanup()
    }, 100)

    setTimeout(cleanup, 10_000)
  }, 300)
})
