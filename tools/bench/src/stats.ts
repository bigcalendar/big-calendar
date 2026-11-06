// Small statistics helpers for the harness.

/** The median of a non-empty list. */
export function median(values: readonly number[]): number {
  if (values.length === 0) throw new Error('median of an empty list')
  const sorted = values.toSorted((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1
    ? (sorted[middle] ?? 0)
    : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
}
