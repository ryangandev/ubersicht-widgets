import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

test('a repo configured as the Übersicht widgets folder exposes only the desktop entrypoint', async () => {
  const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
  const discovered = [];
  async function scan(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      // These are the installed Übersicht 1.6 resolver's directory exclusions.
      if (
        ['node_modules', 'src', 'lib', '.git', '.data'].includes(entry.name) &&
        entry.isDirectory()
      )
        continue;
      if (entry.isDirectory()) await scan(path);
      else if (/\.(coffee|js|jsx)$/.test(entry.name)) discovered.push(relative(root, path));
    }
  }
  await scan(root);
  assert.deepEqual(discovered, ['dashboard/index.jsx']);
});
