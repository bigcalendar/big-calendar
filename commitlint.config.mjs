/**
 * Conventional Commits are mandatory — versioning, changelogs, and GitHub
 * Release notes are all derived from them (see plan §13).
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      1,
      'always',
      [
        'core',
        'localizer',
        'localizer-temporal',
        'localizer-luxon',
        'styles',
        'dnd',
        'react',
        'codemods',
        'vue',
        'angular',
        'lit',
        'storybook-core',
        'storybook-react',
        'e2e',
        'repo',
        'ci',
        'deps',
      ],
    ],
  },
}
