'use client'
import { useEffect } from 'react'
import { report } from '../report.js'
export default function Page() {
  useEffect(() => {
    Promise.all([
      import('../../lib/route-a.js'),
      import('../../lib/route-b.js'),
    ])
      .then(([{ a }, { b }]) =>
        report('concurrent', {
          ok: a?.seen === true && b?.seen === true,
          a,
          b,
        }),
      )
      .catch((e) =>
        report('concurrent', { ok: false, error: String(e?.stack ?? e) }),
      )
  }, [])
  return <p>concurrent</p>
}
