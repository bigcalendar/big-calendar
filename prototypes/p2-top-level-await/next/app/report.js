export async function report(scenario, result) {
  await fetch('/report', {
    method: 'POST',
    body: JSON.stringify({
      scenario,
      build: process.env.NEXT_PUBLIC_BUILD,
      ua: navigator.userAgent,
      ...result,
    }),
  })
  const next = document.documentElement.dataset.next
  if (next) location.href = next
}
