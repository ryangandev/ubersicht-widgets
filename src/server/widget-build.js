import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = dirname(dirname(fileURLToPath(import.meta.url)));
export async function buildWidgetPreview() {
  const { build } = await import('esbuild');
  const result = await build({
    entryPoints: [join(root, 'public/widget-preview-entry.js')],
    bundle: true,
    write: false,
    format: 'esm',
    charset: 'utf8',
    jsxFactory: 'h',
    inject: [join(root, 'public/jsx-dom.js')],
    target: 'safari15',
    alias: { uebersicht: join(root, 'public/widget-runtime.js') },
  });
  return result.outputFiles[0].text;
}
