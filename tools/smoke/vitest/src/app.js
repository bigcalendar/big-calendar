// The smoke app: imports every published package as an app would and prints one line the check
// looks for. As packages gain runtime, this grows to exercise it (D-87: one smoke test per target).
import { EVENT_MIME_TYPE } from '@big-calendar/core'
import * as interactions from '@big-calendar/interactions'
import * as react from '@big-calendar/react'
import * as reactUi from '@big-calendar/react-ui'
import * as temporal from '@big-calendar/temporal'
import * as testing from '@big-calendar/testing'

const loaded = [interactions, react, reactUi, temporal, testing].every(
  (module) => typeof module === 'object',
)
export const message = `big-calendar smoke: ${EVENT_MIME_TYPE} ${loaded ? 'all packages loaded' : 'MISSING'}`
