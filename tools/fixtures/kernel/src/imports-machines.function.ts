// Breaks the dependency direction: the kernel imports the machines layer.
import { machine } from '@big-calendar/fixture-machines'

/** Returns the machine. */
export function useMachine(): string {
  return machine
}
