// Breaks the binding budget rules: keyboard handling in the binding.
/** A box that handles keys itself. */
export function KeyBox() {
  return <div onKeyDown={() => undefined} />
}
KeyBox.displayName = 'KeyBox'
