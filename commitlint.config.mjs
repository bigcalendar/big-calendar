// Conventional commits (workflow rule 8). Scopes are the package names (D-60) plus the
// workspace areas below; a commit outside them uses `repo`.
const packages = [
  'core',
  'interactions',
  'react',
  'react-ui',
  'styles',
  'temporal',
  'recurrence',
  'availability',
  'ics',
  'normalize',
  'editing',
  'codemods',
  'testing',
  'mcp',
]
const areas = ['repo', 'docs', 'ci', 'deps', 'tools', 'release']

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', [...packages, ...areas]],
    'scope-empty': [2, 'never'],
  },
}
