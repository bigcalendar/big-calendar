// Breaks the dependency direction: react-ui imports the kernel directly.
import { kernel } from '@big-calendar/fixture-kernel'

/** Shows the kernel. */
export function Kernel() {
  return <span>{kernel}</span>
}
Kernel.displayName = 'Kernel'
