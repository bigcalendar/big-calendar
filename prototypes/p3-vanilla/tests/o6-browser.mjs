import { chromium } from 'playwright'
const b = await chromium.launch()
async function runWith(machine) {
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  p.on('pageerror', (e) => errors.push(String(e)))
  await p.goto(`http://localhost:4800/?view=week&machine=${machine}`)
  await p.focus('[data-item="standup"]')
  const out = []
  for (const k of [
    'Shift+F10',
    'ArrowDown',
    'Enter',
    'ArrowDown',
    'Shift+ArrowDown',
    'ArrowRight',
    'ArrowRight',
    'ArrowRight',
    'Enter',
    'ArrowLeft',
    'Enter',
  ]) {
    await p.keyboard.press(k)
    await p.waitForTimeout(220)
    out.push(
      await p.evaluate(
        () =>
          `${document.activeElement.getAttribute('aria-label')} | ${document.querySelector('[role=status]').textContent}`,
      ),
    )
  }
  await p.close()
  return { out, errors }
}
const a = await runWith('fsm')
const x = await runWith('xstate')
console.log('errors:', a.errors, x.errors)
console.log(
  'identical in the browser:',
  JSON.stringify(a.out) === JSON.stringify(x.out),
)
console.log(x.out.slice(-3).join('\n'))
await b.close()
