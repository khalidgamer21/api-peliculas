import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

test('El comando de inicio usa el puerto y la base configurados', async (t) => {
  const folder = mkdtempSync(join(tmpdir(), 'peliculas-arranque-'));
  const filename = join(folder, 'catalogo.db');
  const child = spawn(process.execPath, ['server.js'], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    env: { ...process.env, PORT: '0', DB_PATH: filename },
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const exited = new Promise((done) => child.once('exit', done));
  t.after(async () => {
    if (child.exitCode === null) child.kill();
    await exited;
    assert.ok(resolve(folder).startsWith(resolve(tmpdir()) + sep));
    rmSync(folder, { recursive: true, force: true });
  });

  const base = await new Promise((done, reject) => {
    let output = '';
    let errors = '';
    const timeout = setTimeout(
      () => reject(new Error('El servidor no inicio a tiempo')),
      10000
    );
    child.stderr.on('data', (chunk) => {
      errors += chunk.toString();
    });
    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
      const match = output.match(/http:\/\/localhost:(\d+)/);
      if (match) {
        clearTimeout(timeout);
        done(`http://127.0.0.1:${match[1]}`);
      }
    });
    child.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once('exit', () => {
      clearTimeout(timeout);
      reject(new Error(`El servidor termino antes de iniciar: ${errors}`));
    });
  });
  const response = await fetch(`${base}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { estado: 'ok' });
  assert.ok(existsSync(filename));
});
