import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server.js';

test('El servidor publica React y conserva las rutas JSON de la API', async (t) => {
  const folder = await mkdtemp(join(tmpdir(), 'cineteca-web-'));
  const dist = join(folder, 'dist');
  await mkdir(join(dist, 'assets'), { recursive: true });
  await writeFile(join(dist, 'index.html'), '<!doctype html><html lang="es"><body>Cineteca</body></html>');
  await writeFile(join(dist, 'assets', 'app.js'), 'console.log("Cineteca");');
  await writeFile(join(folder, 'fuera.json'), '{"privado":true}');
  await writeFile(join(dist, '.env'), 'CLAVE=privada');

  const app = createApp(':memory:', { staticDir: dist });
  app.listen(0, '127.0.0.1');
  await once(app, 'listening');
  const base = 'http://127.0.0.1:' + app.address().port;
  t.after(async () => {
    const closed = once(app, 'close');
    app.close();
    await closed;
    await rm(folder, { recursive: true, force: true });
  });

  for (const path of ['/', '/media', '/generos', '/directores/', '/productoras', '/tipos']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(await response.text(), /Cineteca/);
  }
  const head = await fetch(base + '/media', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');

  const asset = await fetch(base + '/assets/app.js');
  assert.equal(asset.status, 200);
  assert.match(asset.headers.get('content-type'), /javascript/);
  assert.match(asset.headers.get('cache-control'), /immutable/);

  for (const path of ['/health', '/api/generos']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /application\/json/);
  }
  for (const path of ['/api', '/api/desconocido', '/assets/falta.js', '/.env', '/%2e%2e%2ffuera.json', '/%ZZ']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 404, path);
    assert.deepEqual(await response.json(), { error: 'Ruta no encontrada' });
  }
  assert.equal((await fetch(base + '/', { method: 'POST' })).status, 404);
});
