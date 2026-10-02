// Browser-only JSX factory injected by esbuild; Übersicht supplies its own React runtime.
export function h(tag, props, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (key === 'key' || value == null) continue;
    if (key === 'className') element.className = value;
    else if (key.startsWith('on') && typeof value === 'function')
      element.addEventListener(key.slice(2).toLowerCase(), value);
    else element.setAttribute(key, String(value));
  }
  const append = (child) => {
    if (Array.isArray(child)) child.forEach(append);
    else if (child != null && child !== false)
      element.append(child instanceof Node ? child : document.createTextNode(String(child)));
  };
  children.forEach(append);
  return element;
}
