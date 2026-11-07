// Syntax newer than ES2025 (explicit resource management), which the ES2025 check must catch.
export function open(resource) {
  using handle = resource
  return handle.value
}
