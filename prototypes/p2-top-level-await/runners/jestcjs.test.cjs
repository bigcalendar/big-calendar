// Jest's default CommonJS mode (babel-jest), as many existing apps run it.
const { check } = require('./src/core.js')
test('loads', () => expect(check).toBeDefined())
