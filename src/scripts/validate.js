import { buildWidgetPreview } from '../server/widget-build.js';
import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
const root = dirname(dirname(fileURLToPath(import.meta.url)));
for (const directory of ['server', 'public', 'scripts', 'tests'])
  for (const file of await readdir(join(root, directory))) {
    if (!file.endsWith('.js')) continue;
    const result = spawnSync(process.execPath, ['--check', join(root, directory, file)], {
      encoding: 'utf8',
    });
    if (result.status !== 0) throw new Error(result.stderr);
  }
await buildWidgetPreview();
console.log(
  'JavaScript syntax and actual Übersicht JSX build passed. Native desktop rendering still requires Übersicht.',
);
