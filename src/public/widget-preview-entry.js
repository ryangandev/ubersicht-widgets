import { render, className } from '../../dashboard/index.jsx';
const style = document.createElement('style');
style.textContent = `.one-thing-widget {${className}}`;
document.head.append(style);
const root = document.getElementById('widget');
let updating = false;
async function refresh() {
  if (updating) return;
  updating = true;
  try {
    const response = await fetch('/api/widget', { cache: 'no-store' });
    if (!response.ok) throw new Error('Disconnected');
    root.replaceChildren(render({ output: await response.text() }));
  } catch {
    root.replaceChildren(render({ error: true }));
  } finally {
    updating = false;
  }
}
refresh();
setInterval(refresh, 2000);
