// Allowed by D-102: inline callbacks take the parameters their caller defines.
/** Sorts and sums numbers. */
export function sortedTotal({ values }: { values: readonly number[] }): number {
  return [...values]
    .sort((a, b) => a - b)
    .reduce((sum, value) => sum + value, 0)
}
