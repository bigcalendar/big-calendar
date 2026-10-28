// The "binding" of this prototype: applies framework-neutral prop-getter
// descriptors ({ attrs, on }) to DOM elements (D-72). Handlers are stored so
// they can be replaced on update without stacking listeners.
export function applyProps(el, { attrs = {}, on = {} } = {}) {
  for (const [name, value] of Object.entries(attrs)) {
    if (name === 'class') el.className = value
    else if (name.startsWith('--')) el.style.setProperty(name, value)
    else if (value === false || value === null || value === undefined)
      el.removeAttribute(name)
    else el.setAttribute(name, value === true ? '' : String(value))
  }
  el.__handlers ??= {}
  for (const [type, fn] of Object.entries(on)) {
    if (!el.__handlers[type])
      el.addEventListener(type, (e) => el.__handlers[type]?.(e))
    el.__handlers[type] = fn
  }
  return el
}

export function h(tag, props, ...children) {
  const el = applyProps(document.createElement(tag), props)
  for (const c of children.flat()) if (c != null) el.append(c)
  return el
}
