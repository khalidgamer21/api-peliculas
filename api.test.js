import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './server.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
test('CRUD, relaciones activas, unicidad y restricciones de borrado', async () => {
  const app = createApp(':memory:');
  await new Promise((r) => app.listen(0, '127.0.0.1', r));
  const call = async (method, path, body) => {
    const r = await fetch(
      `http://127.0.0.1:${app.address().port}/api/${path}`,
      {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      }
    );
    return { status: r.status, data: r.status === 204 ? null : await r.json() };
  };
  try {
    const samples = {
      generos: { nombre: 'Comedia', estado: 'Activo', descripcion: 'Humor' },
      directores: { nombres: 'Ana', estado: 'Activo' },
      productoras: {
        nombre: 'Estudio',
        estado: 'Activo',
        slogan: 'Cine',
        descripcion: 'Estudio',
      },
      tipos: { nombre: 'Corto', descripcion: 'Cortometraje' },
    };
    const ids = {};
    for (const [m, b] of Object.entries(samples)) {
      let r = await call('POST', m, b);
      assert.equal(r.status, 201);
      ids[m] = r.data.id;
      assert.equal((await call('PUT', `${m}/${r.data.id}`, b)).status, 200);
      assert.equal((await call('GET', `${m}/${r.data.id}`)).status, 200);
    }
    const media = {
      serial: 'A1',
      titulo: 'Historia',
      sinopsis: 'Ejemplo',
      url: 'https://example.com/a',
      portada: 'https://example.com/a.jpg',
      anioEstreno: 2024,
      generoId: ids.generos,
      directorId: ids.directores,
      productoraId: ids.productoras,
      tipoId: ids.tipos,
    };
    let r = await call('POST', 'media', media);
    assert.equal(r.status, 201);
    const id = r.data.id;
    assert.equal(
      (await call('PUT', `media/${id}`, { ...media, titulo: 'Actualizada' }))
        .status,
      200
    );
    assert.equal((await call('POST', 'media', media)).status, 409);
    assert.equal(
      (
        await call('POST', 'media', {
          ...media,
          serial: 'B',
          url: 'https://example.com/b',
          directorId: 999,
        })
      ).status,
      400
    );
    assert.equal((await call('DELETE', `generos/${ids.generos}`)).status, 409);
    await call('PATCH', `directores/${ids.directores}`, { estado: 'Inactivo' });
    assert.equal(
      (
        await call('POST', 'media', {
          ...media,
          serial: 'C',
          url: 'https://example.com/c',
        })
      ).status,
      400
    );
    assert.equal((await call('POST', 'generos', {})).status, 400);
    assert.equal((await call('GET', 'media/999')).status, 404);
    assert.equal((await call('DELETE', `media/${id}`)).status, 204);
    for (const m of Object.keys(samples))
      assert.equal((await call('DELETE', `${m}/${ids[m]}`)).status, 204);
  } finally {
    await new Promise((r) => app.close(r));
  }
});

test('Los datos se conservan al reiniciar el servidor', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'peliculas-test-'));
  const filename = join(directory, 'prueba.db');
  let app;
  const start = async () => {
    app = createApp(filename);
    await new Promise((r) => app.listen(0, '127.0.0.1', r));
    return `http://127.0.0.1:${app.address().port}`;
  };
  try {
    let base = await start();
    const response = await fetch(`${base}/api/directores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombres: 'Director persistente',
        estado: 'Activo',
      }),
    });
    assert.equal(response.status, 201);
    const created = await response.json();
    await new Promise((r) => app.close(r));
    base = await start();
    const saved = await fetch(`${base}/api/directores/${created.id}`);
    assert.equal(saved.status, 200);
    assert.deepEqual(await saved.json(), created);
  } finally {
    if (app?.listening) await new Promise((r) => app.close(r));
    rmSync(directory, { recursive: true, force: true });
  }
});
