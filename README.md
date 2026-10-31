# API REST de películas y series

Backend monolítico en JavaScript con Node.js y SQLite persistente. Sin dependencias externas. Requiere Node.js 22.13 o superior con node:sqlite disponible (puede mostrar aviso experimental según versión).

## Ejecutar

Desde esta carpeta: `npm start`. Dirección: http://localhost:3000. Pruebas: `npm test`. La base se crea automáticamente en `data/peliculas.db`. PORT y DB_PATH permiten cambiar puerto y archivo. Los datos persisten entre reinicios.

## Modelo de datos

Cada tabla tiene id entero, fechaCreacion y fechaActualizacion automáticas en UTC.

| Tabla | Campos |
| --- | --- |
| generos | nombre, estado, descripcion |
| directores | nombres, estado |
| productoras | nombre, estado, slogan, descripcion |
| tipos | nombre, descripcion |
| media | serial único, titulo, sinopsis, url única, portada (URL), anioEstreno, generoId, directorId, productoraId, tipoId |

Media tiene cuatro claves foráneas: cada producción pertenece a un único género, director, productora y tipo; cada catálogo puede tener muchas producciones. Se impide eliminar catálogos asociados. Estados: Activo o Inactivo. Se precargan Acción, Aventura, Ciencia ficción, Drama, Terror, Serie y Película. No se requiere autenticación según el caso. La portada se almacena como URL, no como archivo.

## Servicios y Postman

Importar Postman.json. Los cinco módulos admiten:

| Método | Ruta | Resultado |
| --- | --- | --- |
| POST | /api/{modulo} | Crear, 201 y Location |
| GET | /api/{modulo} | Consultar todos, 200 |
| GET | /api/{modulo}/{id} | Consultar uno, 200 |
| PUT | /api/{modulo}/{id} | Reemplazar campos editables, 200 |
| PATCH | /api/{modulo}/{id} | Actualizar parcialmente, 200 |
| DELETE | /api/{modulo}/{id} | Eliminar, 204 |

Módulos: generos, directores, productoras, tipos, media. Cuerpo JSON obligatorio para crear/actualizar; PUT requiere todos los campos del módulo. GET /health verifica disponibilidad. Los catálogos con estado admiten ?estado=Activo. Errores JSON: 400 validación, 404 inexistente, 405 método, 409 duplicado o relación, 413 cuerpo superior a 1 MB.

Crear primero director y productora. Usar sus identificadores reales al crear media; género y tipo ya tienen semillas. Los ejemplos usan id 1: ajustarlos si se han eliminado registros. Ejecutar eliminaciones al final, primero media. Al crear o actualizar media, las referencias deben existir y los tres catálogos con estado deben estar activos. Desactivar un catálogo conserva las producciones históricas.

## Guion del video (3 a 5 minutos)

0:00–0:20: presentarse y nombrar a los integrantes reales (mínimo 2, máximo 4).
0:20–1:00: explicar las cinco tablas y sus relaciones.
1:00–2:30: iniciar el servidor y demostrar POST y PUT de los cinco módulos con Postman.
2:30–3:30: consultar media, demostrar rechazo de URL duplicada y de director inactivo.
3:30–4:30: borrar media, ejecutar las pruebas y explicar persistencia y conclusiones.

## Publicación y entrega

Crear un repositorio GitHub o Bitbucket y subir el contenido de esta carpeta. Desde ella: `git init`, `git add .`, `git commit -m "Implementar API de películas"`, `git branch -M main`, `git remote add origin URL_DEL_REPOSITORIO`, `git push -u origin main`. Sustituir la URL por la del repositorio real. No subir data ni datos personales.

Grabar el video con los integrantes reales, subirlo a Google Drive y comprobar que el tutor pueda abrir el enlace. Entregar el enlace del repositorio y del video en Canvas. Este proyecto incluye el backend solicitado; no implementa un frontend ni reproduce archivos de video. La publicación, grabación y envío en Canvas quedan pendientes del equipo.
