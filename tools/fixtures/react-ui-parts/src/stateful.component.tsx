// Breaks the react-ui rules: local state.
import { useState } from 'react'

/** A counter that owns state. */
export function Counter() {
  const [count] = useState(0)
  return <span>{count}</span>
}
Counter.displayName = 'Counter'
