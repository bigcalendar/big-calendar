// Drives keyboard paths and prints what a screen reader would get: the focused
// element's role and accessible name, plus any live-region text.
import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e)))
const state = async () =>
  p.evaluate(() => {
    const a = document.activeElement
    const status = document.querySelector('[role="status"]').textContent
    const label = document.querySelector('.bc-label').textContent
    return {
      role: a.getAttribute('role') ?? a.tagName.toLowerCase(),
      name: a.getAttribute('aria-label') ?? a.textContent.trim().slice(0, 60),
      status,
      label,
    }
  })
async function step(desc, ...keys) {
  for (const k of keys) await p.keyboard.press(k)
  await p.waitForTimeout(260)
  const s = await state()
  console.log(
    `${desc.padEnd(34)} → [${s.role}] ${s.name}${s.status ? `   ⟨live: ${s.status}⟩` : ''}`,
  )
}
await p.goto('http://localhost:4800/?view=month')
await p.focus('.bc-tool-today')
await step('start: Today button')
await step('ArrowRight in toolbar', 'ArrowRight')
await step('Tab out of toolbar', 'Tab')
await step('ArrowRight', 'ArrowRight')
await step('ArrowDown', 'ArrowDown')
await step('ArrowUp ArrowLeft (back to 28)', 'ArrowUp', 'ArrowLeft')
await step('Shift+ArrowRight ×2', 'Shift+ArrowRight', 'Shift+ArrowRight')
await step('Escape', 'Escape')
await step('Tab → event group', 'Tab')
await step('ArrowDown', 'ArrowDown')
await step('ArrowDown ×3', 'ArrowDown', 'ArrowDown', 'ArrowDown')
await step('Enter on +N more', 'Enter')
await step('ArrowDown in popover', 'ArrowDown')
await step('Escape closes popover', 'Escape')
await step('Shift+Tab → its day', 'Shift+Tab')
await step('PageDown (next month)', 'PageDown')
await step('PageUp', 'PageUp')
await step('Tab → events', 'Tab')
await step('Shift+F10 menu', 'Shift+F10')
await step('ArrowDown (Move)', 'ArrowDown')
await step('Enter → move mode', 'Enter')
await step('ArrowRight (Thu)', 'ArrowRight')
await step('ArrowRight ×2 (Sat, invalid)', 'ArrowRight', 'ArrowRight')
await step('Enter on invalid', 'Enter')
await step('ArrowLeft ×2 (Thu) + Enter', 'ArrowLeft', 'ArrowLeft', 'Enter')
console.log('--- week')
await p.goto('http://localhost:4800/?view=week')
await p.focus('.bc-tool-today')
await step('Tab → all-day grid', 'Tab')
await step('ArrowRight', 'ArrowRight')
await step('ArrowDown (hop to time)', 'ArrowDown')
await step('ArrowUp (hop back)', 'ArrowUp')
await step('Tab → time grid', 'Tab')
await step('ArrowDown', 'ArrowDown')
await step('Shift+ArrowDown ×2', 'Shift+ArrowDown', 'Shift+ArrowDown')
await step('Enter confirms', 'Enter')
await step('Tab → events (entry)', 'Tab')
await step('ArrowDown', 'ArrowDown')
await step('Shift+Tab → its slot', 'Shift+Tab')
console.log('--- fall back')
await p.goto('http://localhost:4800/?view=week&date=2026-11-01')
await p.focus('.bc-tool-today')
await step('Tab ×2 → time grid', 'Tab', 'Tab')
await step('Ctrl+Home', 'Control+Home')
await step('ArrowDown ×3 (1:30)', 'ArrowDown', 'ArrowDown', 'ArrowDown')
await step('Tab → events', 'Tab')
await step('ArrowDown', 'ArrowDown')
console.log('--- spring forward')
await p.goto('http://localhost:4800/?view=week&date=2026-03-08')
await p.focus('.bc-tool-today')
await step('Tab ×2, Ctrl+Home', 'Tab', 'Tab', 'Control+Home')
await step(
  'ArrowDown ×4 (skip gap?)',
  'ArrowDown',
  'ArrowDown',
  'ArrowDown',
  'ArrowDown',
)
await step('ArrowUp', 'ArrowUp')
console.log('errors:', errors)
await b.close()
