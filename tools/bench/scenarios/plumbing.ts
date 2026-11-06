// S0's only scenario: proves the harness end to end (bundling, profiles, timing, comparison) before
// there's a kernel to time. S1 adds month and week with 5,000 events (testing standard).
import type { Scenario } from './scenario.ts'

export const scenario: Scenario = {
  name: 'plumbing',
  description: 'Sorts 50,000 numbers. Exists only to prove the harness works.',
  setup() {
    return Array.from({ length: 50_000 }, (_, i) => (i * 7919) % 50_021)
  },
  run(state) {
    ;(state as number[]).toSorted((a, b) => a - b)
  },
}
