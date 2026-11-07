// Breaks the strict-CSP rule: sets innerHTML.
/** Writes markup. */
export function write(element: { innerHTML: string }): void {
  element.innerHTML = '<b>no</b>'
}
