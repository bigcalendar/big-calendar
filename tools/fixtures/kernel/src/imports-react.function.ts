// Breaks the dependency direction: the kernel imports a framework.
import { version } from 'react'

/** Returns React's version. */
export function reactVersion(): string {
  return version
}
