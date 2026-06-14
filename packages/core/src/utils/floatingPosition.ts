import type { Placement, Platform, Rect } from '@floating-ui/core'

/** A floating-ui placement string (e.g. `bottom-start`, `top`). */
export type FloatingPlacement = Placement

/** The computed top-layer position, in viewport (`fixed`) coordinates. */
export interface FloatingPosition {
  /** Distance from the inline-start viewport edge, in pixels. */
  x: number
  /** Distance from the block-start viewport edge, in pixels. */
  y: number
  /** The placement floating-ui actually resolved to (may flip from the request). */
  placement: Placement
}

/** Options for {@link positionFloating}. */
export interface PositionFloatingOptions {
  /** Preferred placement before flip/shift (default `bottom-start`). */
  placement?: FloatingPlacement | undefined
  /** Gap between the anchor and the floating element, in pixels (default `4`). */
  offset?: number | undefined
}

function importFloatingUi() {
  return import('@floating-ui/core')
}

let modulePromise: ReturnType<typeof importFloatingUi> | null = null

/**
 * Lazily import `@floating-ui/core` once and cache the module promise, so the
 * positioning engine stays out of the initial bundle until the first top-layer
 * surface opens (§7.5). Subsequent calls reuse the resolved module.
 */
function loadFloatingUi(): ReturnType<typeof importFloatingUi> {
  modulePromise ??= importFloatingUi()
  return modulePromise
}

function rectOf(element: Element): Rect {
  const { x, y, width, height } = element.getBoundingClientRect()
  return { x, y, width, height }
}

/**
 * The smallest DOM platform `@floating-ui/core` needs. Our floating elements live
 * in the browser top layer (native Popover API / modal `<dialog>`), so they
 * position against the viewport with `strategy: 'fixed'`. That means the three
 * required platform methods can come straight from `getBoundingClientRect` and
 * the viewport box — no `@floating-ui/dom` dependency (§7.5, DECISIONS 2026-06-02).
 */
const platform: Platform = {
  getElementRects: ({ reference, floating }) => ({
    reference: rectOf(reference),
    floating: { ...rectOf(floating), x: 0, y: 0 },
  }),
  getDimensions: (element) => {
    const { width, height } = element.getBoundingClientRect()
    return { width, height }
  },
  getClippingRect: () => ({
    x: 0,
    y: 0,
    width: globalThis.innerWidth,
    height: globalThis.innerHeight,
  }),
}

/**
 * Compute a top-layer element's viewport position relative to an anchor, using a
 * lazily-loaded `@floating-ui/core` with `offset` + `flip` + `shift` middleware.
 * The caller applies the result as `position: fixed; inset-*: <x|y>px`.
 */
export async function positionFloating(
  reference: HTMLElement,
  floating: HTMLElement,
  options?: PositionFloatingOptions,
): Promise<FloatingPosition> {
  const { computePosition, offset, flip, shift, size } = await loadFloatingUi()
  const { x, y, placement } = await computePosition(reference, floating, {
    strategy: 'fixed',
    placement: options?.placement ?? 'bottom-start',
    platform,
    middleware: [
      offset(options?.offset ?? 4),
      flip(),
      shift({ padding: 8 }),
      // Keep a large popover within the viewport. Available dimensions are written
      // as CSS custom properties (not direct inline styles) so class-level rules
      // can reference them with min() — e.g. min(300px, var(--bc-float-avail-h)).
      // A direct inline max-block-size would override class rules regardless of
      // cascade, preventing per-component height caps from taking effect.
      size({
        padding: 8,
        apply: ({ availableWidth, availableHeight, elements }) => {
          elements.floating.style.maxInlineSize = `${Math.max(0, availableWidth)}px`
          elements.floating.style.setProperty('--bc-float-avail-h', `${Math.max(0, availableHeight)}px`)
        },
      }),
    ],
  })
  return { x, y, placement }
}
