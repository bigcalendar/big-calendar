// The decision-entry check (agent toolset; workflow rule 7): a change to `docs/spec/` or to
// `docs/decisions.md` needs a new decision row, and past rows are never edited or removed.

/** What the check needs from a diff. */
export interface DecisionDiff {
  /** Files the pull request changes. */
  changedFiles: readonly string[]
  /** `docs/decisions.md`'s unified diff against the base (empty when unchanged). */
  decisionsDiff: string
}

/** The problems found; empty when the change is fine. */
export function checkDecisions({
  changedFiles,
  decisionsDiff,
}: DecisionDiff): string[] {
  const touchesSpecs = changedFiles.some((file) =>
    file.startsWith('docs/spec/'),
  )
  const touchesLog = changedFiles.includes('docs/decisions.md')
  if (!touchesSpecs && !touchesLog) return []

  const lines = decisionsDiff.split('\n')
  const row = /^\| D-(\d+) \|/
  const removed = lines
    .filter((line) => line.startsWith('-') && !line.startsWith('---'))
    .map((line) => line.slice(1))
  const added = lines
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .map((line) => line.slice(1))
  const removedIds = removed.flatMap((line) => row.exec(line)?.[1] ?? [])
  const addedIds = added.flatMap((line) => row.exec(line)?.[1] ?? [])

  const problems: string[] = []
  for (const id of removedIds) {
    problems.push(
      `D-${id} was edited or removed. Past decisions never change; add a new entry that amends it.`,
    )
  }
  const newIds = addedIds.filter((id) => !removedIds.includes(id))
  if (touchesSpecs && newIds.length === 0) {
    problems.push(
      'docs/spec/ changed without a new decision in docs/decisions.md (workflow rule 7; use the decide skill).',
    )
  }
  return problems
}
