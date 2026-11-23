# Despliegue de Cineteca en Railway

En la tercera entrega publicamos el servidor de Node.js y la interfaz de React en un mismo servicio. El servidor entrega los archivos compilados de React y atiende las solicitudes de /api. Las cinco pantallas usan rutas relativas, asi que comparten la direccion HTTPS con la API.

## Enlaces de la entrega

- [Aplicacion publicada](https://api-peliculas-production-80747e62.up.railway.app/media)
- [Estado de la API](https://api-peliculas-production-80747e62.up.railway.app/health)
- [Codigo de la tercera entrega](https://github.com/khalidgamer21/api-peliculas/tree/codex/ea3-cloud)

## Preparar el codigo

En la raiz del repositorio ejecutamos los siguientes comandos.

~~~sh
npm test
npm run build
npm start
~~~

El comando build instala las dependencias de web y crea la carpeta web/dist. El servidor permite abrir /media, /generos, /directores, /productoras y /tipos directamente y al recargar el navegador. La ruta /health permite comprobar que el servidor esta disponible.

## Crear el servicio

1. Iniciamos sesion en Railway y creamos un proyecto desde el repositorio khalidgamer21/api-peliculas.
2. En Source seleccionamos la rama codex/ea3-cloud y dejamos la raiz del repositorio como directorio de trabajo.
3. Railway detecta el Dockerfile. La primera etapa instala las dependencias y compila React. La segunda copia los archivos compilados y arranca con node server.js.
4. El Dockerfile define Node.js 24, HOST=0.0.0.0, NODE_ENV=production y DB_PATH=/data/peliculas.db. En Variables dejamos esos tres valores y PORT=3000 para el puerto del dominio.
5. Creamos un volumen de 500 MB y lo montamos en /data. La base SQLite se guarda dentro de ese volumen.
6. Desplegamos los cambios y revisamos los registros hasta que el servicio aparezca disponible.
7. En Settings indicamos /health como Healthcheck Path. En Networking generamos el dominio publico y abrimos la aplicacion con HTTPS.

## Comprobar la aplicacion

Abrimos /health y comprobamos la respuesta estado ok. Por HTTP creamos, consultamos, editamos y eliminamos un registro temporal de cada modulo. La produccion temporal usa las referencias de los cuatro catalogos. Tambien creamos y editamos un genero desde React y reiniciamos el servicio para verificar el volumen.

La revision del 22 de noviembre de 2026 paso 37 comprobaciones HTTP en la direccion publica. Se verificaron las operaciones de los cinco modulos y los estados de duplicado y borrado protegido. Despues del reinicio, las tres producciones de demostracion conservaron sus identificadores, seriales y fechas de creacion. Tambien creamos Comedia y lo cambiamos a Comedia familiar desde la interfaz publicada.

El plan gratuito o de prueba tiene limites de uso. La disponibilidad del servicio depende del saldo y de las condiciones que muestra Railway en la cuenta.

## Fuentes

- [Despliegue con Docker](https://docs.railway.com/builds/dockerfiles)
- [Volumenes persistentes](https://docs.railway.com/volumes)
- [Plan gratuito](https://docs.railway.com/pricing/free-plan)
