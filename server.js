import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_BODY_BYTES = 1024 * 1024;

function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}

async function readJson(req) {
  const contentType = req.headers['content-type']
    ?.split(';')[0]
    .trim()
    .toLowerCase();
  const chunks = [];
  let bytes = 0;
  let tooLarge = Number(req.headers['content-length']) > MAX_BODY_BYTES;
  // Contamos bytes y decodificamos al final para conservar el texto UTF-8.
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > MAX_BODY_BYTES) {
      tooLarge = true;
      chunks.length = 0;
    }
    if (!tooLarge && contentType === 'application/json') chunks.push(chunk);
  }
  // Consumimos el resto sin guardarlo para responder sin cortar la conexion.
  if (contentType !== 'application/json')
    fail(415, 'Usa Content-Type: application/json');
  if (tooLarge) fail(413, 'Cuerpo demasiado grande');

  let input;
  try {
    input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    fail(400, 'JSON invalido');
  }
  if (!input || Array.isArray(input) || typeof input !== 'object') {
    fail(400, 'Se requiere un objeto JSON');
  }
  return input;
}

export function createApp(filename = 'data/peliculas.db') {
  if (filename !== ':memory:')
    mkdirSync(resolve(filename, '..'), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA foreign_keys=ON');
  const schemas = {
    generos: { nombre: 'text', estado: 'state', descripcion: 'text' },
    directores: { nombres: 'text', estado: 'state' },
    productoras: {
      nombre: 'text',
      estado: 'state',
      slogan: 'text',
      descripcion: 'text',
    },
    tipos: { nombre: 'text', descripcion: 'text' },
    media: {
      serial: 'text',
      titulo: 'text',
      sinopsis: 'text',
      url: 'url',
      portada: 'url',
      anioEstreno: 'year',
      generoId: 'id',
      directorId: 'id',
      productoraId: 'id',
      tipoId: 'id',
    },
  };
  for (const [table, fields] of Object.entries(schemas)) {
    const columns = Object.entries(fields).map(
      ([name, type]) =>
        `${name} ${['year', 'id'].includes(type) ? 'INTEGER' : 'TEXT'} NOT NULL${['serial', 'url'].includes(name) ? ' UNIQUE' : ''}${type === 'state' ? " CHECK(estado IN ('Activo','Inactivo'))" : ''}`
    );
    columns.push(
      'fechaCreacion TEXT NOT NULL',
      'fechaActualizacion TEXT NOT NULL'
    );
    if (table === 'media')
      for (const [field, parent] of Object.entries({
        generoId: 'generos',
        directorId: 'directores',
        productoraId: 'productoras',
        tipoId: 'tipos',
      }))
        columns.push(
          `FOREIGN KEY(${field}) REFERENCES ${parent}(id) ON DELETE RESTRICT`
        );
    db.exec(
      `CREATE TABLE IF NOT EXISTS ${table}(id INTEGER PRIMARY KEY AUTOINCREMENT,${columns.join(',')})`
    );
  }
  for (const [table, names] of [
    ['generos', ['Accion', 'Aventura', 'Ciencia ficcion', 'Drama', 'Terror']],
    ['tipos', ['Serie', 'Pelicula']],
  ]) {
    if (!db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n)
      for (const nombre of names) {
        const now = new Date().toISOString();
        if (table === 'generos')
          db.prepare(
            'INSERT INTO generos(nombre,estado,descripcion,fechaCreacion,fechaActualizacion) VALUES(?,?,?,?,?)'
          ).run(nombre, 'Activo', nombre, now, now);
        else
          db.prepare(
            'INSERT INTO tipos(nombre,descripcion,fechaCreacion,fechaActualizacion) VALUES(?,?,?,?)'
          ).run(nombre, nombre, now, now);
      }
  }
  const server = http.createServer(async (req, res) => {
    const send = (status, data) => {
      res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
      });
      res.end(data === undefined ? undefined : JSON.stringify(data));
    };
    try {
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'GET' && url.pathname === '/health')
        return send(200, { estado: 'ok' });
      const match = url.pathname.match(
        /^\/api\/(generos|directores|productoras|tipos|media)(?:\/(\d+))?\/?$/
      );
      if (!match) return send(404, { error: 'Ruta no encontrada' });
      const [, table, rawId] = match,
        id = Number(rawId),
        fields = schemas[table];
      if (rawId && (!Number.isSafeInteger(id) || id < 1))
        fail(400, 'Identificador invalido');
      let existing = rawId
        ? db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(id)
        : null;
      if (rawId && !existing)
        return send(404, { error: 'Registro no encontrado' });
      if (req.method === 'GET') {
        if (rawId) return send(200, existing);
        const estado = url.searchParams.get('estado');
        if (url.searchParams.has('estado') && !fields.estado)
          fail(400, 'Este modulo no tiene estado');
        if (
          url.searchParams.has('estado') &&
          !['Activo', 'Inactivo'].includes(estado)
        )
          fail(400, 'Estado invalido');
        return send(
          200,
          estado
            ? db
                .prepare(`SELECT * FROM ${table} WHERE estado=? ORDER BY id`)
                .all(estado)
            : db.prepare(`SELECT * FROM ${table} ORDER BY id`).all()
        );
      }
      if (req.method === 'DELETE' && rawId) {
        db.prepare(`DELETE FROM ${table} WHERE id=?`).run(id);
        return send(204);
      }
      if (!(
        (req.method === 'POST' && !rawId) ||
        (['PUT', 'PATCH'].includes(req.method) && rawId)
      )) {
        res.setHeader('Allow', rawId ? 'GET, PUT, PATCH, DELETE' : 'GET, POST');
        return send(405, { error: 'Metodo no permitido' });
      }
      const input = await readJson(req);
      // Otra solicitud puede modificar o borrar el registro mientras llega el cuerpo.
      if (rawId) {
        existing = db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(id);
        if (!existing) fail(404, 'Registro no encontrado');
      }
      for (const key of Object.keys(input))
        if (!Object.hasOwn(fields, key))
          fail(400, `Campo no permitido: ${key}`);
      const values = req.method === 'PATCH' ? { ...existing, ...input } : input;
      for (const [key, type] of Object.entries(fields)) {
        const value = values[key];
        if (['text', 'url', 'state'].includes(type)) {
          if (
            typeof value !== 'string' ||
            !value.trim() ||
            value.length > 10000
          )
            fail(400, `Campo invalido: ${key}`);
          values[key] = value.trim();
        }
        if (type === 'state' && !['Activo', 'Inactivo'].includes(values[key]))
          fail(400, 'Estado debe ser Activo o Inactivo');
        if (type === 'url') {
          try {
            if (!['https:', 'http:'].includes(new URL(values[key]).protocol))
              throw Error();
          } catch {
            fail(400, `URL invalida: ${key}`);
          }
        }
        if (
          type === 'year' &&
          (!Number.isInteger(value) ||
            value < 1888 ||
            value > new Date().getFullYear() + 5)
        )
          fail(400, 'Ano de estreno invalido');
        if (type === 'id' && (!Number.isSafeInteger(value) || value < 1))
          fail(400, `Referencia invalida: ${key}`);
      }
      if (table === 'media')
        for (const [field, parent] of Object.entries({
          generoId: 'generos',
          directorId: 'directores',
          productoraId: 'productoras',
          tipoId: 'tipos',
        })) {
          const row = db
            .prepare(`SELECT * FROM ${parent} WHERE id=?`)
            .get(values[field]);
          if (!row || (parent !== 'tipos' && row.estado !== 'Activo'))
            fail(
              400,
              `${field} debe referenciar un registro existente${parent === 'tipos' ? '' : ' activo'}`
            );
        }
      const keys = Object.keys(fields),
        now = new Date().toISOString();
      let resultId = id;
      if (req.method === 'POST') {
        resultId = Number(
          db
            .prepare(
              `INSERT INTO ${table}(${keys.join(',')},fechaCreacion,fechaActualizacion) VALUES(${keys.map(() => '?').join(',')},?,?)`
            )
            .run(...keys.map((k) => values[k]), now, now).lastInsertRowid
        );
        res.setHeader('Location', `/api/${table}/${resultId}`);
      } else
        db.prepare(
          `UPDATE ${table} SET ${keys.map((k) => `${k}=?`).join(',')},fechaActualizacion=? WHERE id=?`
        ).run(...keys.map((k) => values[k]), now, id);
      send(
        req.method === 'POST' ? 201 : 200,
        db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(resultId)
      );
    } catch (error) {
      if (error.status) send(error.status, { error: error.message });
      else if (/UNIQUE/.test(error.message))
        send(409, {
          error: error.message.includes('media.serial')
            ? 'El serial ya esta registrado'
            : 'La URL ya esta registrada',
        });
      else if (/FOREIGN KEY/.test(error.message))
        send(409, {
          error: 'No se puede eliminar un registro asociado a media',
        });
      else {
        console.error(error);
        send(500, { error: 'Error interno' });
      }
    }
  });
  server.on('close', () => db.close());
  return server;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = process.env.PORT === undefined ? 3000 : Number(process.env.PORT);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('PORT debe ser un entero entre 0 y 65535');
  }
  const server = createApp(process.env.DB_PATH);
  server.listen(port, '127.0.0.1', () => {
    console.log(`API disponible en http://localhost:${server.address().port}`);
  });
}
