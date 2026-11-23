# Despliegue de Cineteca en Railway

En la tercera entrega publicamos el servidor de Node.js y la interfaz de React en un mismo servicio. El servidor entrega los archivos compilados de React y atiende las solicitudes de /api. Las cinco pantallas usan rutas relativas, asi que comparten la direccion HTTPS con la API.

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
3. Railway toma los comandos de railway.toml. Compila con npm run build y arranca con npm start.
4. En Variables agregamos HOST=0.0.0.0, NODE_ENV=production, RAILPACK_NODE_VERSION=24 y DB_PATH=/data/peliculas.db. Railway asigna PORT al servidor.
5. Creamos un volumen y lo montamos en /data. La base SQLite se guarda dentro de ese volumen.
6. Desplegamos los cambios y revisamos los registros hasta que el servicio aparezca disponible.
7. En Networking generamos el dominio publico y abrimos la aplicacion con HTTPS.

## Comprobar la aplicacion

Abrimos /health y comprobamos la respuesta estado ok. Desde React creamos y editamos un genero, un director, una productora y un tipo. Despues creamos una produccion que use esos cuatro registros. Recargamos para comprobar que la API conserva el cambio y reiniciamos el servicio para verificar el volumen.

El plan gratuito o de prueba tiene limites de uso. La disponibilidad del servicio depende del saldo y de las condiciones que muestra Railway en la cuenta.

## Fuentes

- [Configuracion del servicio](https://docs.railway.com/config-as-code)
- [Volumenes persistentes](https://docs.railway.com/volumes)
- [Plan gratuito](https://docs.railway.com/pricing/free-plan)
