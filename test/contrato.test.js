import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  setup,
  catalogs,
  relations,
  mediaInput,
} from '../support/api-fixture.js';

for (const table of [...Object.keys(catalogs), 'media']) {
  test(`${table}: crear, listar, consultar, actualizar y eliminar`, async (t) => {
    const { call } = await setup(t);
    const input = table === 'media' ? await mediaInput(call) : catalogs[table];
    const created = await call('POST', table, input);
    assert.equal(created.status, 201);
    assert.deepEqual(
      Object.fromEntries(
        Object.keys(input).map((key) => [key, created.data[key]])
      ),
      input
    );
    assert.equal(
      created.headers.get('location'),
      `/api/${table}/${created.data.id}`
    );
    assert.ok(Number.isSafeInteger(created.data.id));
    assert.ok(Number.isFinite(Date.parse(created.data.fechaCreacion)));
    assert.equal(created.data.fechaCreacion, created.data.fechaActualizacion);

    const path = `${table}/${created.data.id}`;
    const list = await call('GET', table);
    assert.equal(list.status, 200);
    assert.ok(list.data.some((row) => row.id === created.data.id));
    assert.deepEqual((await call('GET', path)).data, created.data);

    const key =
      table === 'media'
        ? 'titulo'
        : table === 'directores'
          ? 'nombres'
          : 'nombre';
    const updated = await call('PUT', path, {
      ...input,
      [key]: 'Nombre actualizado',
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.data[key], 'Nombre actualizado');
    assert.equal(updated.data.fechaCreacion, created.data.fechaCreacion);
    assert.ok(
      Date.parse(updated.data.fechaActualizacion) >=
        Date.parse(created.data.fechaActualizacion)
    );
    assert.deepEqual((await call('GET', path)).data, updated.data);

    const patched = await call('PATCH', path, { [key]: 'Cambio parcial' });
    assert.equal(patched.status, 200);
    assert.equal(patched.data[key], 'Cambio parcial');
    for (const field of Object.keys(input).filter((field) => field !== key)) {
      assert.deepEqual(patched.data[field], input[field]);
    }

    const invalid = await call('PUT', path, { [key]: 'Incompleto' });
    assert.equal(invalid.status, 400);
    assert.deepEqual((await call('GET', path)).data, patched.data);
    const removed = await call('DELETE', path);
    assert.equal(removed.status, 204);
    assert.equal(removed.data, null);
    assert.equal((await call('GET', path)).status, 404);
  });

  test(`${table}: valida todos los campos obligatorios`, async (t) => {
    const { call } = await setup(t);
    const input = table === 'media' ? await mediaInput(call) : catalogs[table];
    for (const key of Object.keys(input)) {
      await t.test(`Falta ${key}`, async () => {
        const invalid = { ...input };
        delete invalid[key];
        const result = await call('POST', table, invalid);
        assert.equal(result.status, 400);
        assert.equal(typeof result.data.error, 'string');
      });
    }
  });
}

test('Precarga los cinco generos y los dos tipos definidos en el caso', async (t) => {
  const { call } = await setup(t);
  const genres = await call('GET', 'generos');
  assert.deepEqual(
    genres.data.map((row) => row.nombre),
    ['Accion', 'Aventura', 'Ciencia ficcion', 'Drama', 'Terror']
  );
  assert.ok(genres.data.every((row) => row.estado === 'Activo'));
  assert.deepEqual(
    (await call('GET', 'tipos')).data.map((row) => row.nombre),
    ['Serie', 'Pelicula']
  );
});

test('Impide duplicados de serial y URL tanto al crear como al actualizar', async (t) => {
  const { call } = await setup(t);
  const input = await mediaInput(call);
  assert.equal((await call('POST', 'media', input)).status, 201);
  const other = {
    ...input,
    serial: 'MED-002',
    url: 'https://example.com/med-002.mp4',
  };
  const second = await call('POST', 'media', other);
  assert.equal(second.status, 201);
  for (const field of ['serial', 'url']) {
    await t.test(`Duplicado de ${field}`, async () => {
      const duplicate = { ...other, [field]: input[field] };
      assert.equal((await call('POST', 'media', duplicate)).status, 409);
      assert.equal(
        (await call('PUT', `media/${second.data.id}`, duplicate)).status,
        409
      );
      assert.equal(
        (
          await call('PATCH', `media/${second.data.id}`, {
            [field]: input[field],
          })
        ).status,
        409
      );
      assert.deepEqual(
        (await call('GET', `media/${second.data.id}`)).data,
        second.data
      );
    });
  }
});

test('Valida las cuatro relaciones al crear y actualizar media', async (t) => {
  const { call } = await setup(t);
  const input = await mediaInput(call);
  const created = await call('POST', 'media', input);
  const path = `media/${created.data.id}`;
  for (const [field, table] of Object.entries(relations)) {
    await t.test(`${field}: registro inexistente`, async () => {
      const invalid = {
        ...input,
        serial: 'MED-OTRA',
        url: 'https://example.com/otra',
        [field]: 999999,
      };
      assert.equal((await call('POST', 'media', invalid)).status, 400);
      assert.equal(
        (await call('PUT', path, { ...input, [field]: 999999 })).status,
        400
      );
      assert.equal(
        (await call('PATCH', path, { [field]: 999999 })).status,
        400
      );
    });
    if (table !== 'tipos') {
      await t.test(`${field}: registro inactivo`, async () => {
        const catalogPath = `${table}/${input[field]}`;
        assert.equal(
          (await call('PATCH', catalogPath, { estado: 'Inactivo' })).status,
          200
        );
        assert.equal(
          (
            await call('POST', 'media', {
              ...input,
              serial: 'MED-OTRA',
              url: 'https://example.com/otra',
            })
          ).status,
          400
        );
        assert.equal((await call('PUT', path, input)).status, 400);
        assert.equal(
          (await call('PATCH', path, { titulo: 'Otro titulo' })).status,
          400
        );
        assert.equal((await call('GET', path)).data.id, created.data.id);
        assert.equal(
          (await call('PATCH', catalogPath, { estado: 'Activo' })).status,
          200
        );
      });
    }
  }
  assert.deepEqual((await call('GET', path)).data, created.data);
});

test('Protege las cuatro relaciones al borrar catalogos', async (t) => {
  const { call } = await setup(t);
  const input = await mediaInput(call);
  const created = await call('POST', 'media', input);
  for (const [field, table] of Object.entries(relations)) {
    const path = `${table}/${input[field]}`;
    assert.equal((await call('DELETE', path)).status, 409);
    assert.equal((await call('GET', path)).status, 200);
  }
  assert.equal((await call('DELETE', `media/${created.data.id}`)).status, 204);
  for (const [field, table] of Object.entries(relations)) {
    assert.equal(
      (await call('DELETE', `${table}/${input[field]}`)).status,
      204
    );
  }
});

for (const table of ['generos', 'directores', 'productoras']) {
  test(`${table}: filtra por estado y rechaza estados invalidos`, async (t) => {
    const { call } = await setup(t);
    await call('POST', table, catalogs[table]);
    await call('POST', table, { ...catalogs[table], estado: 'Inactivo' });
    for (const estado of ['Activo', 'Inactivo']) {
      const filtered = await call('GET', `${table}?estado=${estado}`);
      assert.equal(filtered.status, 200);
      assert.ok(filtered.data.length > 0);
      assert.ok(filtered.data.every((row) => row.estado === estado));
    }
    assert.equal(
      (await call('POST', table, { ...catalogs[table], estado: 'Otro' }))
        .status,
      400
    );
    assert.equal((await call('GET', `${table}?estado=Otro`)).status, 400);
    assert.equal((await call('GET', `${table}?estado=`)).status, 400);
  });
}

test('Rechaza JSON invalido y tipos de contenido distintos de JSON', async (t) => {
  const { call } = await setup(t);
  for (const raw of ['{', '', 'null', '[]', '"texto"', '3', 'true']) {
    assert.equal(
      (await call('POST', 'directores', undefined, { raw })).status,
      400
    );
  }
  assert.equal(
    (
      await call('POST', 'directores', catalogs.directores, {
        headers: { 'Content-Type': 'text/plain' },
      })
    ).status,
    415
  );
  assert.equal(
    (
      await call('POST', 'directores', catalogs.directores, {
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    ).status,
    201
  );
});

test('Rechaza campos desconocidos e impide editar id y fechas', async (t) => {
  const { call } = await setup(t);
  const created = await call('POST', 'directores', catalogs.directores);
  for (const field of [
    'id',
    'fechaCreacion',
    'fechaActualizacion',
    'desconocido',
    '__proto__',
  ]) {
    assert.equal(
      (
        await call('POST', 'directores', {
          ...catalogs.directores,
          [field]: 'otro',
        })
      ).status,
      400
    );
    assert.equal(
      (
        await call('PATCH', `directores/${created.data.id}`, {
          [field]: 'otro',
        })
      ).status,
      400
    );
  }
  assert.deepEqual(
    (await call('GET', `directores/${created.data.id}`)).data,
    created.data
  );
});

test('Valida texto, URLs, anio y referencias numericas', async (t) => {
  const { call } = await setup(t);
  const input = await mediaInput(call);
  const cases = [
    { titulo: '' },
    { titulo: '   ' },
    { titulo: 123 },
    { titulo: 'a'.repeat(10001) },
    { url: 'no-es-url' },
    { url: 'ftp://example.com/video' },
    { portada: 'javascript:alert(1)' },
    { anioEstreno: 1887 },
    { anioEstreno: new Date().getFullYear() + 6 },
    { anioEstreno: 2024.5 },
    { anioEstreno: '2024' },
    { generoId: [input.generoId] },
    { directorId: 0 },
    { productoraId: -1 },
    { tipoId: '1' },
  ];
  for (const invalid of cases) {
    const result = await call('POST', 'media', { ...input, ...invalid });
    assert.equal(result.status, 400, JSON.stringify(invalid).slice(0, 120));
  }
  const valid = await call('POST', 'directores', {
    nombres: '  Nombre con espacios  ',
    estado: ' Activo ',
  });
  assert.equal(valid.status, 201);
  assert.equal(valid.data.nombres, 'Nombre con espacios');
  assert.equal(valid.data.estado, 'Activo');
});

test('Devuelve estados y metodos permitidos para rutas inexistentes o no soportadas', async (t) => {
  const { call } = await setup(t);
  assert.equal((await call('GET', '/health')).status, 200);
  assert.equal((await call('GET', '/no-existe')).status, 404);
  assert.equal((await call('GET', 'media/999999')).status, 404);
  for (const method of ['PUT', 'PATCH', 'DELETE']) {
    assert.equal(
      (await call(method, 'directores', catalogs.directores)).status,
      405
    );
  }
  const invalid = await call('POST', 'generos/1', catalogs.generos);
  assert.equal(invalid.status, 405);
  assert.equal(invalid.headers.get('allow'), 'GET, PUT, PATCH, DELETE');
  assert.equal((await call('GET', 'tipos?estado=Activo')).status, 400);
});
