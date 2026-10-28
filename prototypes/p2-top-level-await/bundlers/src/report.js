export async function run(scenario, check) {
  let result
  try {
    result = await check()
  } catch (error) {
    result = { ok: false, error: String(error?.stack ?? error) }
  }
  const build = document.documentElement.dataset.build
  await fetch('/report', {
    method: 'POST',
    body: JSON.stringify({
      scenario,
      build,
      ua: navigator.userAgent,
      ...result,
    }),
  })
  document.body.textContent = JSON.stringify(result)
  parent.postMessage({ done: scenario }, '*')
  const next = document.documentElement.dataset.next
  if (next) location.href = next
}
// Unhandled rejections from the module loader count as failures too.
addEventListener('unhandledrejection', (event) => {
  fetch('/report', {
    method: 'POST',
    body: JSON.stringify({
      scenario: 'unhandledrejection',
      build: document.documentElement.dataset.build,
      ok: false,
      error: String(event.reason?.stack ?? event.reason),
    }),
  })
})
