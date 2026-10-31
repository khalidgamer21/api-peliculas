import assert from 'node:assert/strict';
import { createApp } from '../server.js';

export async function setup(t) {
  const server = createApp(':memory:');
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;

  async function call(method, path, body, options = {}) {
    const headers =
      body === undefined && options.raw === undefined
        ? {}
        : { 'Content-Type': 'application/json' };
    const response = await fetch(
      `${base}${path.startsWith('/') ? path : `/api/${path}`}`,
      {
        method,
        headers: { ...headers, ...options.headers },
        body:
          options.raw ??
          (body === undefined ? undefined : JSON.stringify(body)),
        signal: AbortSignal.timeout(10000),
      }
    );
    const text = await response.text();
    return {
      status: response.status,
      data: text ? JSON.parse(text) : null,
      headers: response.headers,
    };
  }
  return { call, base };
}

export const catalogs = {
  generos: { nombre: 'Comedia', estado: 'Activo', descripcion: 'Humor' },
  directores: { nombres: 'Director de prueba', estado: 'Activo' },
  productoras: {
    nombre: 'Estudio',
    estado: 'Activo',
    slogan: 'Cine para todos',
    descripcion: 'Estudio de prueba',
  },
  tipos: { nombre: 'Cortometraje', descripcion: 'Produccion corta' },
};

export const relations = {
  generoId: 'generos',
  directorId: 'directores',
  productoraId: 'productoras',
  tipoId: 'tipos',
};

export async function mediaInput(call) {
  const references = {};
  for (const [field, table] of Object.entries(relations)) {
    const created = await call('POST', table, catalogs[table]);
    assert.equal(created.status, 201);
    references[field] = created.data.id;
  }
  return {
    serial: 'MED-001',
    titulo: 'Historia',
    sinopsis: 'Una historia de prueba',
    url: 'https://example.com/med-001.mp4',
    portada: 'https://example.com/portada.jpg',
    anioEstreno: 2024,
    ...references,
  };
}
