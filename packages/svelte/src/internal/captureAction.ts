/**
 * Svelte action that attaches event listeners in capture phase.
 * Usage: <div use:captureListeners={{ focus: onFocusCapture, keydown: onKeydownCapture }}>
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHandler = (e: any) => void

export function captureListeners(
  node: HTMLElement,
  handlers: Partial<Record<string, AnyHandler>>,
): { update(newHandlers: Partial<Record<string, AnyHandler>>): void; destroy(): void } {
  const active = { ...handlers }

  for (const [type, handler] of Object.entries(active)) {
    if (handler) node.addEventListener(type, handler as EventListener, true)
  }

  return {
    update(newHandlers) {
      for (const [type, oldHandler] of Object.entries(active)) {
        if (oldHandler) node.removeEventListener(type, oldHandler as EventListener, true)
      }
      Object.assign(active, newHandlers)
      for (const [type, handler] of Object.entries(active)) {
        if (handler) node.addEventListener(type, handler as EventListener, true)
      }
    },
    destroy() {
      for (const [type, handler] of Object.entries(active)) {
        if (handler) node.removeEventListener(type, handler as EventListener, true)
      }
    },
  }
}
