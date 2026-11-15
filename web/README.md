# Cineteca

Esta es la segunda parte del proyecto de peliculas y series. La interfaz en React usa la misma API REST y la misma base SQLite de la primera entrega.

## Integrantes

- Yimy Antonio Mosquera Asprilla
- Marlon Monterrosa Munoz

## Como probarla

Usamos Node.js 22.13 o superior. Desde la carpeta web instalamos las dependencias y arrancamos el modo de demostracion.

~~~sh
npm ci
npm run demo
~~~

Abrimos [http://127.0.0.1:5174](http://127.0.0.1:5174). Ya aparecen tres producciones de ejemplo. La demo usa la API real con una base en memoria que se reinicia al cerrar el servidor. Los nombres y enlaces de produccion son de ejemplo. La imagen de la sala y las tres portadas se generaron para la interfaz.

Para trabajar con la base de la primera entrega abrimos dos terminales. La primera queda en la raiz del repositorio.

~~~sh
npm start
~~~

En la segunda entramos a la carpeta web.

~~~sh
cd web
npm ci
npm run dev
~~~

Abrimos [http://127.0.0.1:5173](http://127.0.0.1:5173). Vite reenvia las solicitudes que empiezan con /api al puerto 3000. Si cambiamos el puerto de Node.js, ajustamos API_TARGET en un archivo .env.local dentro de web. Por ejemplo, API_TARGET=http://127.0.0.1:3001.

## Pantallas

| Pantalla | Funcion | Ruta de la API |
| --- | --- | --- |
| Generos | Mantener los generos con nombre, descripcion y estado | /api/generos |
| Directores | Mantener los nombres y el estado de los directores principales | /api/directores |
| Productoras | Registrar el nombre, slogan, descripcion y estado | /api/productoras |
| Tipos | Definir tipos como Pelicula, Serie y Documental | /api/tipos |
| Media | Gestionar las fichas, la portada, los enlaces y los creditos | /api/media |

Las pantallas usan GET para consultar el listado y cada ficha, POST para crear, PUT para guardar una edicion y DELETE para eliminar con confirmacion. Las fechas se consultan en la ficha. Antes de registrar media, agregamos un director y una productora activos. El formulario solo permite elegir generos, directores y productoras activos y tipos ya registrados. Si un serial o una URL ya aparece en otra produccion, la interfaz muestra el mensaje de la API y conserva los campos del formulario.

## Compilacion y revision

En la carpeta web ejecutamos npm run build. El resultado queda en web/dist. Para revisar esa compilacion en local dejamos corriendo la API y ejecutamos npm run preview. Abrimos [http://127.0.0.1:4173](http://127.0.0.1:4173). En la raiz podemos ejecutar npm test para comprobar la API.
