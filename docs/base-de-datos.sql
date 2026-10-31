-- Diseno de la base de datos de peliculas y series.
-- Generado desde las tablas que crea server.js.
-- Este archivo es una referencia; la API inicializa la base automaticamente.

PRAGMA foreign_keys = ON;

CREATE TABLE directores(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombres TEXT NOT NULL,
  estado TEXT NOT NULL CHECK(estado IN ('Activo', 'Inactivo')),
  fechaCreacion TEXT NOT NULL,
  fechaActualizacion TEXT NOT NULL
);

CREATE TABLE generos(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  estado TEXT NOT NULL CHECK(estado IN ('Activo', 'Inactivo')),
  descripcion TEXT NOT NULL,
  fechaCreacion TEXT NOT NULL,
  fechaActualizacion TEXT NOT NULL
);

CREATE TABLE media(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  serial TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  sinopsis TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  portada TEXT NOT NULL,
  anioEstreno INTEGER NOT NULL,
  generoId INTEGER NOT NULL,
  directorId INTEGER NOT NULL,
  productoraId INTEGER NOT NULL,
  tipoId INTEGER NOT NULL,
  fechaCreacion TEXT NOT NULL,
  fechaActualizacion TEXT NOT NULL,
  FOREIGN KEY(generoId) REFERENCES generos(id) ON DELETE RESTRICT,
  FOREIGN KEY(directorId) REFERENCES directores(id) ON DELETE RESTRICT,
  FOREIGN KEY(productoraId) REFERENCES productoras(id) ON DELETE RESTRICT,
  FOREIGN KEY(tipoId) REFERENCES tipos(id) ON DELETE RESTRICT
);

CREATE TABLE productoras(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  estado TEXT NOT NULL CHECK(estado IN ('Activo', 'Inactivo')),
  slogan TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  fechaCreacion TEXT NOT NULL,
  fechaActualizacion TEXT NOT NULL
);

CREATE TABLE tipos(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  fechaCreacion TEXT NOT NULL,
  fechaActualizacion TEXT NOT NULL
);
