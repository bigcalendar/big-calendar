'use client'
import { useEffect } from 'react'
import { coreSeen, coreSource } from '../../lib/core.js'
import { interactionsSeen } from '../../lib/interactions.js'
import { report } from '../report.js'
export default function Page() {
  useEffect(() => {
    report('static', {
      ok: coreSeen === true && interactionsSeen === true,
      source: coreSource,
    })
  }, [])
  return <p>static</p>
}
