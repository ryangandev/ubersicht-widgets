import { mkdir, readFile, open, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createState, validateState, applyAction } from './model.js';

export async function createStore(directory) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const filename = join(directory, 'focus.json'),
    lockPath = join(directory, 'focus.lock');
  async function acquire() {
    try {
      const lock = await open(lockPath, 'wx', 0o600);
      await lock.writeFile(String(process.pid));
      await lock.close();
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const pid = Number(await readFile(lockPath, 'utf8'));
      if (!Number.isInteger(pid) || pid <= 0)
        throw new Error(
          'The data directory has an invalid lock. Check it before removing focus.lock.',
        );
      try {
        process.kill(pid, 0);
      } catch (e) {
        if (e.code === 'ESRCH') {
          await unlink(lockPath);
          return acquire();
        }
        throw e;
      }
      throw new Error('This data directory is already open in another One Thing process.');
    }
  }
  await acquire();
  let state;
  try {
    state = validateState(JSON.parse(await readFile(filename, 'utf8')));
  } catch (error) {
    if (error.code === 'ENOENT') state = createState();
    else {
      await unlink(lockPath);
      throw new Error(`Cannot read ${filename}; original data preserved. ${error.message}`);
    }
  }
  let pending = Promise.resolve();
  return {
    read: () => structuredClone(state),
    mutate(action, options) {
      const result = pending.then(async () => {
        const next = applyAction(state, action, options);
        if (next === state) return structuredClone(state);
        const temporary = join(directory, `.focus-${randomUUID()}.tmp`);
        try {
          const file = await open(temporary, 'wx', 0o600);
          try {
            await file.writeFile(JSON.stringify(next, null, 2) + '\n');
            await file.sync();
          } finally {
            await file.close();
          }
          await rename(temporary, filename);
        } catch (error) {
          await unlink(temporary).catch(() => {});
          throw error;
        }
        state = next;
        return structuredClone(state);
      });
      pending = result.catch(() => {});
      return result;
    },
    async close() {
      await pending;
      await unlink(lockPath);
    },
  };
}
