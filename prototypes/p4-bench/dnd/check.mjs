// Mouse behavior of each engine in each Playwright engine: move, resize, drag-out, Escape, autoscroll.
// Also scripting time for a 60-step drag on Chromium with 4× CPU slowdown.
import { chromium, firefox, webkit } from 'playwright'
import { writeFile } from 'node:fs/promises'
import { serve } from '../serve.mjs'
const { url, close } = await serve()
const out = {}
const center = async (page, sel) => {
  const b = await page.locator(sel).boundingBox()
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 }
}
async function dragPath(page, from, to, steps = 20) {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(from.x + 6, from.y + 6, { steps: 3 })
  await page.mouse.move(to.x, to.y, { steps })
}
const logOf = (page) => page.evaluate(() => globalThis.__log ?? [])
const only = process.argv.slice(2)
for (const [ename, engine] of Object.entries({
  chromium,
  firefox,
  webkit,
}).filter(([n]) => !only.length || only.includes(n))) {
  for (const variant of ['pointer', 'native', 'pragmatic']) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const b = await engine.launch()
      try {
        const r = {}
        const fresh = async () => {
          const p = await b.newPage({ viewport: { width: 1000, height: 800 } })
          await p.goto(`${url}/dnd/?engine=${variant}`)
          await p.waitForSelector('.ev')
          return p
        }
        let p = await fresh()
        // Move: Standup (Mon, slot 18) to Wed slot 22.
        await dragPath(
          p,
          await center(p, '.ev[data-id="a"]'),
          await center(p, '.slot[data-day="3"][data-slot="22"]'),
        )
        await p.mouse.up()
        await p.waitForTimeout(150)
        r.move = (await logOf(p)).some(
          (l) => l === 'commit a day=3 start=22 len=1',
        )
        // Resize: Design review (Tue 20, len 3) to end at slot 24. Fresh page: in Playwright's
        // WebKit, pointer events after a native drag on the same page are unreliable.
        await p.close()
        p = await fresh()
        const hb = await p.locator('.ev[data-id="b"] .handle').boundingBox()
        await p.mouse.move(hb.x + hb.width / 2, hb.y + 3)
        await p.mouse.down()
        const t = await center(p, '.slot[data-day="2"][data-slot="24"]')
        await p.mouse.move(t.x, t.y, { steps: 10 })
        await p.mouse.up()
        await p.waitForTimeout(100)
        r.resize = (await logOf(p)).some(
          (l) => l === 'commit b day=2 start=20 len=5',
        )
        // Drag-out: Lunch to the outside box.
        await dragPath(
          p,
          await center(p, '.ev[data-id="c"]'),
          await center(p, '#out'),
        )
        await p.mouse.up()
        await p.waitForTimeout(150)
        r.dragOut = (await logOf(p)).some(
          (l) => l.startsWith('outside drop') && l.includes('"id":"c"'),
        )
        await p.close()
        // Escape mid-drag.
        p = await fresh()
        await dragPath(
          p,
          await center(p, '.ev[data-id="d"]'),
          await center(p, '.slot[data-day="5"][data-slot="20"]'),
        )
        await p.keyboard.press('Escape')
        await p.mouse.up()
        await p.waitForTimeout(150)
        const l = await logOf(p)
        r.escape = !l.some((x) => x.startsWith('commit d'))
        await p.close()
        // Autoscroll: hold near the bottom edge.
        p = await fresh()
        const sc = await p.locator('.scroller').boundingBox()
        await dragPath(p, await center(p, '.ev[data-id="a"]'), {
          x: sc.x + sc.width / 3,
          y: sc.y + sc.height - 10,
        })
        const before = await p.evaluate(
          () => document.querySelector('.scroller').scrollTop,
        )
        for (let i = 0; i < 10; i++) {
          await p.mouse.move(
            sc.x + sc.width / 3,
            sc.y + sc.height - 10 + (i % 2),
          )
          await p.waitForTimeout(80)
        }
        const after = await p.evaluate(
          () => document.querySelector('.scroller').scrollTop,
        )
        await p.mouse.up()
        r.autoscroll = after - before
        await p.close()
        // Scripting cost of a 60-step move (Chromium only, 4× slowdown).
        if (ename === 'chromium') {
          p = await fresh()
          const cdp = await p.context().newCDPSession(p)
          await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
          await cdp.send('Performance.enable')
          const metric = async () =>
            Object.fromEntries(
              (await cdp.send('Performance.getMetrics')).metrics.map((m) => [
                m.name,
                m.value,
              ]),
            )
          const m0 = await metric()
          await dragPath(
            p,
            await center(p, '.ev[data-id="c"]'),
            await center(p, '.slot[data-day="6"][data-slot="28"]'),
            60,
          )
          await p.mouse.up()
          await p.waitForTimeout(100)
          const m1 = await metric()
          r.scriptMsPer60Moves = +(
            (m1.ScriptDuration - m0.ScriptDuration) *
            1000
          ).toFixed(1)
          r.layoutMs = +(
            (m1.LayoutDuration - m0.LayoutDuration) *
            1000
          ).toFixed(1)
          await p.close()
        }
        out[`${ename}/${variant}`] = r
        console.log(`${ename}/${variant}`.padEnd(20), JSON.stringify(r))
        await b.close()
        break
      } catch (e) {
        console.log(
          `${ename}/${variant} attempt ${attempt} failed: ${e.message.split('\n')[0]}`,
        )
        await b.close().catch(() => {})
      }
    }
  }
}
close()
await writeFile(
  new URL('./results.json', import.meta.url),
  JSON.stringify(out, null, 1),
)
