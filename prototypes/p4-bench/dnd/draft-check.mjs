// The draft must sit in the column under the pointer (checked mid-drag, every engine).
import { chromium } from 'playwright'
import { serve } from '../serve.mjs'
const { url, close } = await serve()
const b = await chromium.launch()
for (const variant of ['pointer', 'native', 'pragmatic']) {
  const p = await b.newPage({ viewport: { width: 1000, height: 800 } })
  await p.goto(`${url}/dnd/?engine=${variant}`)
  const box = async (s) => p.locator(s).boundingBox()
  const a = await box('.ev[data-id="a"]'),
    t = await box('.slot[data-day="4"][data-slot="22"]')
  await p.mouse.move(a.x + 10, a.y + 5)
  await p.mouse.down()
  await p.mouse.move(a.x + 20, a.y + 15, { steps: 3 })
  await p.mouse.move(t.x + t.width / 2, t.y + t.height / 2, { steps: 20 })
  await p.waitForTimeout(100)
  const d = await box('.draft'),
    col = await box('.col[data-day="4"]')
  console.log(
    variant.padEnd(10),
    'draft in Thursday column:',
    d && Math.abs(d.x - col.x) < 4,
  )
  await p.mouse.up()
  await p.close()
}
await b.close()
close()
