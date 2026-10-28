import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e)))
let last = ''
async function step(desc, ...keys) {
  for (const k of keys) await p.keyboard.press(k)
  await p.waitForTimeout(260)
  const s = await p.evaluate(() => {
    const a = document.activeElement
    return {
      role: a.getAttribute('role') ?? a.tagName.toLowerCase(),
      name: a.getAttribute('aria-label') ?? a.textContent.trim().slice(0, 60),
      status: document.querySelector('[role="status"]').textContent,
    }
  })
  const live = s.status && s.status !== last ? `   ⟨live: ${s.status}⟩` : ''
  last = s.status
  console.log(`${desc.padEnd(30)} → [${s.role}] ${s.name}${live}`)
}
await p.goto('http://localhost:4800/?view=month')
await p.focus('.bc-tool-today')
await step('Tab → grid (Oct 28)', 'Tab')
await step('Tab → events', 'Tab')
await step('ArrowDown ×2', 'ArrowDown', 'ArrowDown')
await step('Enter → popover', 'Enter')
await step('ArrowDown', 'ArrowDown')
await step('Escape → back to +N more', 'Escape')
await step('Home (first event)', 'Home')
await step('ArrowDown (Standup)', 'ArrowDown')
await step('Shift+F10', 'Shift+F10')
await step('ArrowDown (Move)', 'ArrowDown')
await step('Enter → move mode', 'Enter')
await step('ArrowRight ×3 (Sat)', 'ArrowRight', 'ArrowRight', 'ArrowRight')
await step('Enter (refused)', 'Enter')
await step('ArrowLeft (Fri) + Enter', 'ArrowLeft', 'Enter')
await p.waitForTimeout(1700)
await step('after the app confirms')
await step(
  'Shift+F10, Move, Escape',
  'Shift+F10',
  'ArrowDown',
  'Enter',
  'ArrowRight',
  'Escape',
)
console.log('--- week move with hop (Standup, Wed 9:00)')
await p.goto('http://localhost:4800/?view=week')
await p.focus('[data-item="standup"]')
await step('focus Standup')
await step('Shift+F10, Move', 'Shift+F10', 'ArrowDown', 'Enter')
await step('ArrowDown (9:30)', 'ArrowDown')
await step('Shift+ArrowDown (10:30)', 'Shift+ArrowDown')
await step('Ctrl? no: PageDown', 'PageDown')
await step('PageUp', 'PageUp')
await step('Escape', 'Escape')
await p.goto('http://localhost:4800/?view=week&date=2026-11-01')
await p.focus('[data-item="handover"]')
await step('fall-back first event')
await step('ArrowDown', 'ArrowDown')
console.log('errors:', errors)
await b.close()
