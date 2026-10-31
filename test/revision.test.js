import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../server.js';

async function setup(t) {
  const server = createApp(':memory:');
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, server };
}

function postChunks(url, chunks) {
  return new Promise((resolve, reject) => {
    const request = http.request(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Connection: 'close' },
      },
      (response) => {
        const data = [];
        response.on('data', (chunk) => data.push(chunk));
        response.on('error', reject);
        response.on('end', () =>
          resolve({
            status: response.statusCode,
            body: JSON.parse(Buffer.concat(data).toString('utf8')),
          })
        );
      }
    );
    request.on('error', reject);
    request.setTimeout(5000, () =>
      request.destroy(new Error('Tiempo agotado'))
    );
    const write = (index) => {
      if (index === chunks.length) return request.end();
      request.write(chunks[index]);
      setTimeout(() => write(index + 1), 10);
    };
    write(0);
  });
}

test('Conserva texto UTF-8 aunque llegue en varios bloques', async (t) => {
  const { base } = await setup(t);
  const nombre = 'Jos\u00e9 Mu\u00f1oz';
  const bytes = Buffer.from(
    JSON.stringify({ nombres: nombre, estado: 'Activo' })
  );
  const split = bytes.indexOf(Buffer.from('\u00e9')) + 1;
  const result = await postChunks(`${base}/api/directores`, [
    bytes.subarray(0, split),
    bytes.subarray(split),
  ]);
  assert.equal(result.status, 201);
  assert.equal(result.body.nombres, nombre);
});

test('Rechaza un id fuera del rango entero seguro con un error de cliente', async (t) => {
  const { base } = await setup(t);
  const response = await fetch(
    `${base}/api/generos/99999999999999999999999999999999999999`
  );
  assert.equal(response.status, 400);
});

test('Devuelve 413 JSON cuando el cuerpo supera 1 MB en varios bloques', async (t) => {
  const { base } = await setup(t);
  const result = await postChunks(`${base}/api/directores`, [
    Buffer.from('{"nombres":"'),
    Buffer.alloc(1024 * 1024, 'a'),
    Buffer.from('","estado":"Activo"}'),
  ]);
  assert.equal(result.status, 413);
  assert.equal(typeof result.body.error, 'string');
  assert.equal((await fetch(`${base}/health`)).status, 200);
});

test('PATCH conserva cambios de otra solicitud recibida mientras llega el cuerpo', async (t) => {
  const { base, server } = await setup(t);
  const created = await fetch(`${base}/api/productoras`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: 'Inicial',
      estado: 'Activo',
      slogan: 'Inicial',
      descripcion: 'Estudio',
    }),
  });
  const { id } = await created.json();
  const delayed = http.request(`${base}/api/productoras/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });
  const finished = new Promise((resolve, reject) => {
    delayed.on('response', (response) => {
      response.resume();
      response.on('end', () => resolve(response.statusCode));
    });
    delayed.on('error', reject);
  });
  const arrived = new Promise((resolve) => server.once('request', resolve));
  delayed.write('{"nombre":');
  await arrived;
  const other = await fetch(`${base}/api/productoras/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slogan: 'Cambio paralelo' }),
  });
  assert.equal(other.status, 200);
  await other.arrayBuffer();
  delayed.end('"Nuevo nombre"}');
  assert.equal(await finished, 200);
  const result = await (await fetch(`${base}/api/productoras/${id}`)).json();
  assert.equal(result.nombre, 'Nuevo nombre');
  assert.equal(result.slogan, 'Cambio paralelo');
});
