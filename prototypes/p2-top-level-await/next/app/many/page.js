'use client'
import { useEffect } from 'react'
import { report } from '../report.js'
export default function Page() {
  useEffect(() => {
    Promise.all([
      import('../../lib/route-a.js'),
      import('../../lib/route-b.js'),
      import('../../lib/route-c.js'),
      import('../../lib/core.js'),
      import('../../lib/interactions.js'),
    ])
      .then(([{ a }, { b }, { c }, core, inter]) => {
        const values = [
          a?.seen,
          b?.seen,
          c?.seen,
          core?.coreSeen,
          inter?.interactionsSeen,
        ]
        report('many', { ok: values.every((v) => v === true), values })
      })
      .catch((e) => report('many', { ok: false, error: String(e?.stack ?? e) }))
  }, [])
  return <p>many</p>
}
