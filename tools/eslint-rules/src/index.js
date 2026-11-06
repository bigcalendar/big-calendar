// The local ESLint plugin: rules for the D-46 and D-65 standards that no published plugin covers.
import displayName from './display-name.js'
import fileSuffix from './file-suffix.js'
import requireTsdoc from './require-tsdoc.js'
import singleObjectParam from './single-object-param.js'

export default {
  meta: { name: '@big-calendar/tools-eslint-rules' },
  rules: {
    'display-name': displayName,
    'file-suffix': fileSuffix,
    'require-tsdoc': requireTsdoc,
    'single-object-param': singleObjectParam,
  },
}
