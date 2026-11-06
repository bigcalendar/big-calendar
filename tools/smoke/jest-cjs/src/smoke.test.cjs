const { EVENT_MIME_TYPE } = require('@big-calendar/core')
const packages = [
  'interactions',
  'react',
  'react-ui',
  'temporal',
  'testing',
].map((name) => require(`@big-calendar/${name}`))

test('requires every package', () => {
  expect(EVENT_MIME_TYPE).toBe('application/x-big-calendar-event+json')
  expect(packages.every((module) => typeof module === 'object')).toBe(true)
})
