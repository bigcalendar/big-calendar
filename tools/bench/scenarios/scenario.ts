// The contract every scenario module follows. A scenario runs in the page; the harness times `run`.

/** A benchmark scenario. `setup` runs once, untimed; `run` is what's measured. */
export interface Scenario {
  /** Shown in the results, such as `month-5000`. */
  name: string
  /** What it measures, for the PR table's readers. */
  description: string
  setup(): unknown
  run(state: unknown): void
}
