export const modules = {
  media: {
    label: 'Media',
    title: 'Peliculas y series',
    singular: 'produccion',
    create: 'Nueva produccion',
    name: 'titulo',
    fields: [
      { key: 'titulo', label: 'Titulo' },
      { key: 'serial', label: 'Serial' },
      { key: 'sinopsis', label: 'Sinopsis', type: 'area' },
      { key: 'anioEstreno', label: 'Anio de estreno', type: 'number' },
      { key: 'tipoId', label: 'Tipo', source: 'tipos' },
      { key: 'generoId', label: 'Genero', source: 'generos' },
      { key: 'directorId', label: 'Director principal', source: 'directores' },
      { key: 'productoraId', label: 'Productora', source: 'productoras' },
      { key: 'portada', label: 'URL de la portada', type: 'url' },
      { key: 'url', label: 'URL de la produccion', type: 'url' },
    ],
  },
  generos: {
    label: 'Generos',
    title: 'Generos',
    singular: 'genero',
    create: 'Nuevo genero',
    name: 'nombre',
    fields: [
      { key: 'nombre', label: 'Nombre' },
      { key: 'estado', label: 'Estado', type: 'state' },
      { key: 'descripcion', label: 'Descripcion', type: 'area' },
    ],
  },
  directores: {
    label: 'Directores',
    title: 'Directores',
    singular: 'director',
    create: 'Nuevo director',
    name: 'nombres',
    fields: [
      { key: 'nombres', label: 'Nombres' },
      { key: 'estado', label: 'Estado', type: 'state' },
    ],
  },
  productoras: {
    label: 'Productoras',
    title: 'Productoras',
    singular: 'productora',
    create: 'Nueva productora',
    name: 'nombre',
    fields: [
      { key: 'nombre', label: 'Nombre' },
      { key: 'estado', label: 'Estado', type: 'state' },
      { key: 'slogan', label: 'Slogan' },
      { key: 'descripcion', label: 'Descripcion', type: 'area' },
    ],
  },
  tipos: {
    label: 'Tipos',
    title: 'Tipos',
    singular: 'tipo',
    create: 'Nuevo tipo',
    name: 'nombre',
    fields: [
      { key: 'nombre', label: 'Nombre' },
      { key: 'descripcion', label: 'Descripcion', type: 'area' },
    ],
  },
};

export const catalogs = Object.keys(modules).filter((key) => key !== 'media');
export const states = ['Activo', 'Inactivo'];

export function recordName(record, module) {
  return record?.[modules[module].name];
}

export function relatedName(references, source, id) {
  const record = references[source]?.find((item) => item.id === id);
  return recordName(record, source) || 'ID ' + id;
}

export function eligibleRecords(references, source) {
  return (references[source] || []).filter((row) => row.estado !== 'Inactivo');
}

export function searchText(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

const dateFormat = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' });
export function formatDate(value) {
  return dateFormat.format(new Date(value));
}
