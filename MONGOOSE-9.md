# Migracion a Mongoose 9.11.4

Actualizacion local en main, verificada el 1 de noviembre de 2026. npm dist-tags.latest devolvio 9.11.4. Se mantiene un rango compatible ^9.11.4 y el lockfile fija las versiones instaladas. No se usa una version beta.

Mongoose 9 requiere Node.js >=20.19.0; este requisito figura en package.json. La validacion local se ejecuto con Node 26.13.0 y npm 12.2.1.

Referencias oficiales: [migracion a 7](https://mongoosejs.com/docs/migrating_to_7.html), [migracion a 8](https://mongoosejs.com/docs/migrating_to_8.html), [migracion a 9](https://mongoosejs.com/docs/migrating_to_9.html). Se revisaron callbacks de consultas/hooks, ObjectId, opciones retiradas y pipelines de actualizacion. Los hooks de produccion existentes ya usan funciones sin next().

## Cambios

- Dependencia mongoose: ^6.6.3 -> ^9.11.4. Nuevo package-lock.json para instalaciones reproducibles.
- security/account-tokens.js: returnDocument: 'after' sustituye a new: true; se conserva la devolucion del usuario actualizado y el consumo atomico del token.
- No se actualizan las otras dependencias directas.

## Validacion

- npm test: 47 pruebas correctas.
- npm run test:integration con SECURITY_TEST_MONGODB_URI apuntando a un replica set temporal: 20 pruebas correctas. Incluye concurrencia de tokens, sesiones, JWT, permisos, contrasenas y deserializacion del consumidor timetrack.
- Las dependencias de este repositorio se instalaron desde su nuevo lockfile en una carpeta temporal local y se resolvieron mediante NODE_PATH para evitar la extraccion lenta de recursos estaticos en la unidad compartida. Para una instalacion normal: npm ci.

## Integracion conjunta

Se preparo un consumidor temporal local con copias de las fuentes de repos/core y repos/timetrack, sin node_modules preexistentes ni ficheros .env, y se instalaron ambas dependencias mediante file: con --omit=dev. Se comprobo identidad de la instancia de Mongoose y version 9.11.4; el arranque completo inicializo una base vacia desechable y comenzo a escuchar en un puerto efimero. El proceso y MongoDB se detuvieron al terminar.

Resultado total: 67 pruebas de core + 269 de timetrack = 336 correctas, ademas del arranque conjunto. Todas las bases usadas fueron temporales; no se utilizaron bases ni credenciales de produccion.

Los consumidores deben actualizar ambos modulos de forma coordinada y evitar copias de desarrollo de Mongoose que creen conexiones distintas. Esta migracion solo modifica repos/core y repos/timetrack: no se han cambiado las copias ni las referencias de submodulos dentro de icetimetrack, ni se ha publicado o desplegado nada.
