# Revision del proyecto

Fecha de revision: 31 de octubre de 2026.

Integrantes: Yimy Antonio Mosquera Asprilla y Marlon Monterrosa Munoz.

## Resultado

La API implementa los cinco modulos y las operaciones de creacion y actualizacion que pide la rubrica. Tambien permite consultar y eliminar registros. Se revisaron los campos del caso, el diseno de las tablas, las relaciones, la persistencia y las respuestas de error.

La parte tecnica revisada queda completa para esta entrega de API REST. La entrega academica sigue pendiente hasta grabar el video o preparar el documento alternativo, habilitar los accesos y enviar los enlaces en Canvas. Este informe de revision no sustituye el documento con normas APA que permite la actividad como alternativa al video.

## Alcance de la revision

Se contrasto el proyecto con el enunciado y la rubrica compartidos, y con las paginas 2 a 4 de Caso_Estudio_Peliculas.pdf. El PDF describe el proyecto web general; la actividad compartida solicita el backend en Node.js y su demostracion con un cliente HTTP. Esta revision corresponde a esa actividad de API REST.

El enunciado compartido no exige Express ni un motor concreto de base de datos. El proyecto usa el servidor HTTP de Node.js y SQLite. No se incluyeron usuarios ni autenticacion, de acuerdo con el alcance indicado en el caso. No se evaluaron grabaciones o anuncios privados de Canvas.

## Comparacion con los requisitos

| Requisito | Resultado comprobado | Evidencia |
| --- | --- | --- |
| API REST con JavaScript en Node.js | Cumple | server.js y package.json |
| Disenar la base de datos | Cumple | Cinco tablas y cuatro relaciones verificadas; esquema en base-de-datos.sql |
| Genero: nombre, estado, fechas y descripcion | Cumple | Pruebas de creacion, lectura, PUT, PATCH y borrado |
| Director: nombres, estado y fechas | Cumple | Pruebas de creacion, lectura, PUT, PATCH y borrado |
| Productora: nombre, estado, fechas, slogan y descripcion | Cumple | Pruebas de creacion, lectura, PUT, PATCH y borrado |
| Tipo: nombre, fechas y descripcion | Cumple | Pruebas de creacion, lectura, PUT, PATCH y borrado |
| Media: serial, titulo, sinopsis, URL, portada, fechas, anio y cuatro referencias | Cumple | Pruebas de todos los campos y operaciones |
| Generos iniciales y tipos Serie y Pelicula | Cumple | Consulta de la base nueva |
| Serial unico y URL unica | Cumple | Rechazo independiente de cada duplicado en POST, PUT y PATCH |
| Un genero, director, productora y tipo por produccion | Cumple | Cuatro claves foraneas obligatorias; rechazo de referencias multiples o invalidas |
| Solo generos, directores y productoras activos al agregar media | Cumple | Pruebas individuales de los tres estados y de referencias inexistentes |
| Permitir nuevos generos y tipos | Cumple | POST y operaciones posteriores sobre registros nuevos |
| Evitar borrar catalogos asociados a media | Cumple | Restriccion comprobada para las cuatro relaciones |
| Mantener los datos entre reinicios | Cumple | Cierre y reapertura del archivo SQLite |
| Funcionamiento con Postman u otro cliente | Cumple | Coleccion ejecutada con Newman, con solicitudes y validaciones reales |
| Codigo fuente en Git | Cumple | Repositorio privado con commits de los cambios realizados |
| Trabajo de dos a cuatro estudiantes | Nombres incluidos | El equipo debe realizar y poder explicar su participacion real |
| Video de tres a cinco minutos o documento alternativo APA | Pendiente | El README incluye un guion; el video y el documento alternativo no estan creados |
| Entrega puntual y accesible | Pendiente | Requiere acceso del tutor y envio dentro del plazo de Canvas |

## Fallas encontradas y corregidas

| Situacion | Comportamiento anterior | Correccion |
| --- | --- | --- |
| Texto UTF-8 dividido entre bloques de la peticion | Un caracter podia guardarse como caracteres de reemplazo | Se conservan los bytes y se decodifica el cuerpo completo antes de leer el JSON |
| Dos actualizaciones parciales mientras llega el cuerpo de una solicitud | PATCH podia sobrescribir el cambio de otro campo con una copia anterior | Se vuelve a consultar el registro al terminar de leer la solicitud y antes de aplicar los cambios |
| Cuerpo superior a 1 MB | En una prueba con cierre de conexion, podia recibirse ECONNRESET en vez de una respuesta JSON | Se deja de guardar el cuerpo al superar el limite y se consume el resto antes de devolver 413 |
| Inicio con un puerto distinto del predeterminado | El mensaje de inicio seguia mostrando 3000 | El mensaje muestra el puerto real que esta usando el servidor |

Tambien se validaron los identificadores fuera del rango seguro, el tipo de contenido JSON y los filtros de estado vacios. Se separaron los mensajes de serial duplicado, URL duplicada y borrado de registros asociados para facilitar las pruebas en Postman.

## Pruebas realizadas

### Pruebas automaticas de la API

Comando: `node --test --experimental-test-coverage --test-reporter=spec`.

Resultado local con Node.js 25.1.0: 58 pruebas y subpruebas aprobadas, cero fallas. No se modifico la base de trabajo.

Se comprobaron:

- POST, GET de lista, GET por id, PUT, PATCH y DELETE en los cinco modulos.
- Campos obligatorios, fechas automaticas y conservacion de la fecha de creacion.
- Errores que no alteran el registro existente.
- Duplicados de serial y URL al crear y actualizar.
- Las cuatro relaciones y los tres catalogos con estado.
- Restricciones de borrado y conservacion de producciones historicas al desactivar catalogos.
- JSON invalido, campos desconocidos y proteccion de id y fechas.
- Validacion de texto, URLs, anio, identificadores y filtros.
- Respuestas 400, 404, 405, 409, 413 y 415.
- Lectura correcta del texto entre bloques y actualizaciones simultaneas.
- Persistencia y arranque real con puerto y ruta de base configurados.

La cobertura local registrada para server.js fue 96.79 % de lineas y 98.52 % de ramas. Es una medida de lo ejecutado por las pruebas, no una garantia de ausencia de errores.

GitHub Actions ejecuta `npm test` con Node.js 22.13.0 y 24. El resultado de cada cambio se puede consultar en la pestana Actions del repositorio.

### Coleccion de Postman

Se ejecuto la coleccion real con Newman 6 en una base temporal, sin sustituir sus scripts por una simulacion.

- 45 solicitudes por ejecucion.
- Dos ejecuciones consecutivas: 90 solicitudes.
- 148 comprobaciones aprobadas y cero fallas.
- Los identificadores se guardaron automaticamente en cada ejecucion.
- Se verificaron datos guardados, fechas, duplicados, catalogos inactivos y borrados protegidos.
- La carpeta final elimino los datos creados por las pruebas.

### Base de datos y archivos

Se inspeccionaron cinco tablas y cuatro claves foraneas en la base real creada por la API. SQLite devolvio `ok` en la comprobacion de integridad. El esquema SQL exportado tambien se ejecuto correctamente en una base nueva.

Se revisaron los archivos de texto del proyecto: no contienen tildes ni emojis. La base de trabajo y node_modules se excluyen de Git. No se reescribio el historial previo ni se atribuyeron commits a otros integrantes.

## Pasos pendientes para entregar

1. Grabar el video de tres a cinco minutos y nombrar a los dos integrantes antes de explicar el funcionamiento. La alternativa permitida es un documento con portada, introduccion, desarrollo, explicacion de cada servicio y conclusion, con normas APA.
2. Compartir el video en Google Drive con acceso para el tutor, si se elige esa opcion.
3. Dar acceso al tutor al repositorio, que es privado.
4. Entregar los enlaces o archivos correspondientes en Canvas dentro del plazo indicado por el curso.

La rubrica asigna 90 puntos al funcionamiento de los cinco modulos y 10 a puntualidad y entrega. Las pruebas respaldan el cumplimiento tecnico; la calificacion y la verificacion de la participacion corresponden al tutor.

## Referencias de apoyo

- Caso_Estudio_Peliculas.pdf y enunciado de la actividad proporcionados por el equipo.
- [Documentacion oficial de Node.js 22.13: disponibilidad de SQLite sin bandera adicional](https://nodejs.org/download/release/v22.13.0/docs/api/cli.html#--no-experimental-sqlite).
- [Documentacion oficial de Postman: ejecucion de colecciones con Newman](https://learning.postman.com/docs/collections/using-newman-cli/installing-running-newman).
