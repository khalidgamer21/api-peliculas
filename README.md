# API de peliculas y series

Este proyecto corresponde al caso de estudio de proyecto integrador dos. La idea es administrar un catalogo de peliculas y series desde una API REST. Organizamos la informacion en cinco modulos: generos, directores, productoras, tipos y media.

## Integrantes

- Yimy Antonio Mosquera Asprilla
- Marlon Monterrosa Munoz

## Como ejecutar el proyecto

Usamos JavaScript con Node.js y SQLite. La base se guarda en un archivo local, asi que podemos probar el proyecto sin configurar otro servidor de base de datos. Necesitamos Node.js 22.13 o superior con soporte para node:sqlite. No hay paquetes externos que instalar.

```bash
git clone https://github.com/khalidgamer21/api-peliculas.git
cd api-peliculas
npm start
```

La API queda en http://localhost:3000. Podemos comprobarla en http://localhost:3000/health. Algunas versiones de Node muestran un aviso experimental de SQLite; el servidor puede seguir funcionando.

La base se crea en data/peliculas.db y conserva los registros al reiniciar. Las variables PORT y DB_PATH permiten cambiar el puerto y la ruta del archivo. La carpeta de datos se excluye de Git.

## Como organizamos los datos

Cada tabla tiene un id entero y fechas de creacion y actualizacion generadas por el servidor en UTC.

| Tabla | Datos que guarda |
| --- | --- |
| generos | nombre, estado, descripcion |
| directores | nombres, estado |
| productoras | nombre, estado, slogan, descripcion |
| tipos | nombre, descripcion |
| media | serial, titulo, sinopsis, url, portada, anioEstreno, generoId, directorId, productoraId, tipoId |

Cada produccion tiene un solo genero, director principal, productora y tipo. Guardamos estas relaciones con claves foraneas. Un mismo registro de los catalogos puede estar asociado a varias producciones.

Al iniciar por primera vez, se crean los generos Accion, Aventura, Ciencia ficcion, Drama y Terror, y los tipos Serie y Pelicula. Los estados permitidos son Activo e Inactivo.

## Servicios disponibles

Reemplazamos {modulo} por generos, directores, productoras, tipos o media.

| Metodo | Ruta | Funcion |
| --- | --- | --- |
| POST | /api/{modulo} | Crear un registro |
| GET | /api/{modulo} | Consultar todos los registros |
| GET | /api/{modulo}/{id} | Consultar un registro |
| PUT | /api/{modulo}/{id} | Actualizar todos sus campos editables |
| PATCH | /api/{modulo}/{id} | Actualizar algunos campos |
| DELETE | /api/{modulo}/{id} | Eliminar un registro |

Para crear y actualizar enviamos JSON con Content-Type: application/json. PUT requiere todos los campos del modulo. PATCH recibe solo los campos que queremos cambiar. Los identificadores y las fechas los maneja el servidor.

Ejemplo para POST /api/directores:

```json
{
  "nombres": "Director de prueba",
  "estado": "Activo"
}
```

Ejemplo para POST /api/media:

```json
{
  "serial": "MED-001",
  "titulo": "Una historia para contar",
  "sinopsis": "Un grupo de amigos prepara su primera pelicula.",
  "url": "https://example.com/videos/med-001.mp4",
  "portada": "https://example.com/portada.jpg",
  "anioEstreno": 2024,
  "generoId": 1,
  "directorId": 1,
  "productoraId": 1,
  "tipoId": 1
}
```

Antes de enviar media debemos crear un director y una productora. Los cuatro identificadores deben coincidir con registros existentes. Las direcciones de example.com son datos de prueba.

## Reglas que aplicamos

- El serial y la URL de cada produccion deben ser unicos.
- Para crear o actualizar media, el genero, director y productora deben estar activos y el tipo debe existir.
- No podemos eliminar un catalogo mientras tenga producciones asociadas. Primero eliminamos la produccion.
- Desactivar un catalogo conserva las producciones que ya lo usan.
- La portada se guarda como una URL HTTP o HTTPS.
- El anio de estreno debe estar entre 1888 y el anio actual mas cinco.
- Los catalogos con estado permiten filtrar con ?estado=Activo o ?estado=Inactivo.

La API responde con 201 al crear, 200 al consultar o actualizar y 204 al eliminar. Los errores se devuelven como JSON: 400 para datos invalidos, 404 para rutas o registros inexistentes, 405 para metodos no permitidos, 409 para duplicados o relaciones que impiden borrar y 413 para cuerpos mayores de 1 MB.

## Pruebas con Postman

Importamos Postman.json y verificamos que baseUrl sea http://localhost:3000. Podemos ejecutar toda la coleccion con Collection Runner o enviar las solicitudes en el orden en que aparecen.

Cada carpeta crea, lista, consulta y actualiza un modulo. La coleccion guarda los identificadores de las respuestas para usarlos en las siguientes solicitudes. Al crear generos tambien genera un valor para que el serial y la URL de media cambien en cada ejecucion. La ultima carpeta elimina los datos de prueba, empezando por media.

Cada solicitud comprueba el estado HTTP esperado. Si una falla, revisamos su respuesta antes de continuar.

## Pruebas automaticas

```bash
npm test
```

Las pruebas verifican las operaciones de los cinco modulos, los duplicados, las referencias inexistentes o inactivas, las restricciones de borrado y la persistencia al reabrir la base. Usan bases temporales y no modifican la base de trabajo. GitHub tambien ejecuta estas pruebas al recibir cambios o una solicitud de integracion.

## Trabajo en equipo

Cada integrante puede clonar el repositorio y crear una rama para sus cambios. Conviene usar nombres relacionados con la tarea, por ejemplo generos, pruebas o documentacion, y mensajes de commit que expliquen lo realizado. Antes de integrar cambios en main, ejecutamos las pruebas y revisamos la propuesta entre los integrantes.

## Video de la entrega

Podemos organizar la explicacion en unos cuatro minutos:

1. Presentarnos y nombrar a los dos integrantes.
2. Explicar las cinco tablas y sus relaciones.
3. Iniciar la API y mostrar la creacion y actualizacion de cada modulo en Postman.
4. Mostrar una consulta, el rechazo de un duplicado y una eliminacion.
5. Ejecutar las pruebas y comentar lo aprendido.

Para entregar compartimos el enlace del repositorio y el enlace de Google Drive del video. Como el repositorio es privado, debemos dar acceso al tutor antes de enviarlo. El video debe durar entre tres y cinco minutos.

El alcance de esta actividad es el backend. La API administra los datos del catalogo; la interfaz web y la reproduccion de videos corresponden a otro desarrollo. El caso no exige registro de usuarios ni autenticacion.
