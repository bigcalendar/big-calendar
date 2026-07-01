/** Converts a CSS-property object to an inline style string suitable for the HTML `style` attribute. */
export function toStyle(obj: Record<string, string>): string {
  return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join('; ')
}
