# Correcciones de seguridad de core

Rama del submódulo: `security/auth-hardening`. Rama del consumidor: `security/core-auth-hardening`.

Los cambios se dejan en el repositorio principal repos/core, sin commit ni publicación para revisión. El código de los repositorios hermanos se ha leído, pero no se ha modificado ni desplegado.

## Alcance y orden de la revisión

Se inspeccionaron antes de editar: `api/auth.route.js`, `api/user.route.js`, `api/routes.js`, rutas públicas y privadas, `authentication`, `authorization`, `verifySignUp`, Passport, modelo User, plantillas de registro/login/cambio de contraseña, formularios de administración y consumidores de los cuatro proyectos.

Las correcciones se organizaron por etapas funcionales:

| Etapa | Hallazgo | Cambio |
| --- | --- | --- |
| 1 | Enlaces de cuenta usaban `salt` | Servicio `security/account-tokens.js`; 32 bytes aleatorios, SHA-256 en BD, propósito, vencimiento y consumo atómico |
| 1 | Cambio de contraseña creaba otro usuario | Servicio `security/passwords.js`; identidad propia o administrador, verificación de contraseña anterior para usuarios normales |
| 1 | Registro con `[null]` | Nuevas cuentas públicas reciben exclusivamente `user`; el registro API con revisión administrativa sigue inactivo |
| 2 | `Users.find(req.body)` | Lista explícita y validación de filtros; rechazo de operadores, objetos anidados y campos de credenciales |
| 3 | CORS abierto y sesiones sin política explícita | Orígenes exactos, cookies seguras, almacenamiento persistente obligatorio en producción, expiración y CSRF |
| 3 | Respuestas de permisos y errores de promesas | 401/403, comprobación del usuario actual y una sola continuación/respuesta |
| 4 | Globales implícitas y mezcla async/callback | Variables locales, promesas esperadas en controladores/configuración/inicialización, límites callback de Passport y sesión conservados |
| 4 | Alta inicial de administrador con credencial fija, detectada durante la revisión | Eliminada; credenciales explícitas solo al inicializar una BD vacía |

No se ha ejecutado `npm audit fix`, ni se han actualizado versiones mayores de bibliotecas. Se han instalado dependencias ya presentes en el lockfile que faltaban localmente y se declara directamente `jsonwebtoken` con la misma línea 9 ya usada por `passport-jwt`.

## Tokens de cuenta y credenciales

- Se conserva `GET/POST /complete-registry/:token` y los nombres de las plantillas. No se usa ni se envía `salt` en nuevos enlaces.
- Registro: vigencia de 24 horas y cuenta inactiva. Recuperación: vigencia de 30 minutos y cuenta activa. Un token de recuperación nunca activa una cuenta desactivada.
- Un solo token pendiente por cuenta. Emitir otro invalida el anterior. El documento guarda `actionTokenHash`, `actionTokenPurpose` y `actionTokenExpiresAt`, nunca el token original.
- `findOneAndUpdate` comprueba el hash, propósito, vencimiento, estado y salt anterior, escribe la contraseña y elimina el token en la misma operación. La prueba de concurrencia contra MongoDB comprueba un único ganador.
- El GET muestra el formulario y no consume el token. Se aplica `no-store` y `Referrer-Policy: no-referrer` a la página de recuperación/registro.
- Los enlaces antiguos basados en `salt` quedan inválidos deliberadamente. No hay fallback inseguro. Para recuperar acceso a una cuenta existente, un administrador puede emitir un enlace nuevo mediante `/api/auth/reset`; las cuentas pendientes pueden gestionarse desde el administrador con la asignación de contraseña y activación existentes.
- La recuperación sigue siendo administrativa: no se ha hecho público `/api/auth/reset`. El formulario de recuperación de login ya llamaba a esa ruta restringida; no se amplían permisos de forma implícita. Para cuentas inexistentes/inactivas se devuelve la misma confirmación de envío y no se envía correo.
- `PUBLIC_ORIGIN=https://dominio-de-la-aplicacion` es obligatorio en producción para construir enlaces de correo sin confiar en Host. En desarrollo se permite el origen de la petición.
- Cambiar/asignar/recuperar una contraseña incrementa `passwordVersion` e invalida tokens de cuenta, JWT anteriores y otras sesiones. La sesión propia del cambio de contraseña continúa. Los JWT históricos sin versión se aceptan únicamente mientras la cuenta siga en versión 0.
- No se cambian algoritmos ni formato de las contraseñas ya almacenadas: se mantiene el KDF legado para permitir migraciones independientes. La comparación se hace con `timingSafeEqual` y se validan tipo y tamaño de la contraseña.
- Serializar User a JSON u objeto elimina `salt`, `hash` y los campos de token; la API de usuarios también los excluye en la consulta.

Los alias `newPassword`/`newPasswordVerify` y la salida interna `req.newPassword` del módulo principal se conservan junto a `password`/`passwordVerify`.

## Contratos HTTP conservados y cambios documentados

| Contrato | Comportamiento después del cambio |
| --- | --- |
| `POST /api/auth/register` | Conserva registro por enlace y `{message: 'OK'}`; siempre rol `user`, inactivo hasta consumir enlace |
| `POST /api/auth/signup` | Conserva espera de revisión administrativa y `{message: 'OK'}`; ignora roles enviados y ahora respeta `SELF_REGISTER` |
| Registro web en uno/dos pasos | Conserva `/register`, `/signup` y redirecciones `registerSucceed`/`registerPending` |
| `POST /api/auth/changepassword/:id` | Actualiza el mismo documento; exige identidad propia o admin; usuario normal envía `oldPassword`; `passwordVerify` es opcional en API y, si se envía, debe coincidir |
| `POST /private/change-password` | Usa el campo existente `password`, verifica identidad y contraseña anterior; exige confirmación si se proporciona |
| `POST /api/auth/setpass/:id` | Sigue restringido a administrador y conserva `{message: 'OK'}` |
| `POST /api/auth/signin` | Conserva `id`, `username`, `email`, `roles` con prefijo `ROLE_` y `accessToken`; credenciales incorrectas dan 401 de forma uniforme |
| `POST /api/user/find` | Devuelve el mismo array; acepta `id`, `_id`, `username`, `email`, `roles`, `active`, `lastLogin`, `createdAt`, `updatedAt`; `roles` múltiples significan cualquiera de ellos; filtros desconocidos, operadores Mongo y estructuras no válidas dan 400 |
| Crear usuario desde administrador | Sigue permitiendo no proporcionar contraseña inicial; la cuenta no puede autenticar hasta asignársela; `active` vacío equivale a falso al crear |
| JWT | Se conservan `x-access-token` y Bearer. Se valida HS256, cuenta activa y versión; los roles usados para autorización proceden de BD |
| `checkPermision` | Se conserva esta grafía pública para todos los consumidores; falta de autenticación da 401 y falta de permiso 403 |
| Redirecciones web protegidas | Se conserva envío al login con `url` codificada. Destinos de login deben ser rutas locales, no URLs externas |
| `GET /logout` | Ya no destruye la sesión; muestra confirmación. `POST /logout` con CSRF cierra sesión |
| JWT en query de páginas web | Ya no inicia sesión con un GET: muestra confirmación protegida con CSRF y usa `POST /token-login`; el enlace conserva su URL. API GET con query sigue funcionando como lectura autenticada, sin crear sesión |

Las cuentas históricas con `[null]` se normalizan a `[]` al validar/guardar, sin conceder `user` ni `admin` automáticamente. No hay migración masiva de documentos ni cambios automáticos en roles existentes.

## Sesiones, CSRF y CORS

`core.setup` mantiene el orden: conexión/configuración → parsers → sesión → Passport → JWT verificado → CSRF → rutas. Sigue aceptando `setup({deserializeUser(id, done)})` y el id serializado sigue siendo una cadena. La comprobación de cuenta activa y versión se aplica también al deserializador personalizado.

Sesión: `resave:false`, `saveUninitialized:false`, `HttpOnly`, `SameSite=Lax`, `Secure` en producción y 8 horas de duración por defecto. `SESSION_MAX_AGE_MS` permite cambiarla con límite de 30 días. Se conserva el nombre histórico `connect.sid` si no se define `COOKIE_NAME`. Si se configura este último, se aplica y las cookies anteriores pueden requerir nuevo login. No se cae silenciosamente a MemoryStore en producción.

En producción, `TRUST_PROXY_HOPS` vale 1 por defecto para Heroku; admite de 0 a 5 saltos. Debe ajustarse a la topología real. SSL usa `req.secure` con esa configuración.

La protección de sesión sigue el patrón de token sincronizado:

1. Las vistas que pasan por `res.render` reciben metadato CSRF, `/js/security.js` y un campo oculto en formularios POST locales. Esto incluye plantillas sobreescritas por consumidores y formularios sin JavaScript. El contenido se marca `no-store`.
2. El cliente compartido añade la cabecera a XHR, jQuery y fetch solo para el mismo origen; también cubre formularios dinámicos. No envía el token a destinos externos ni duplica cabeceras XHR explícitas.
3. Clientes con sesión que no usan estas vistas pueden obtener `{csrfToken}` mediante el nuevo `GET /api/csrf`, conservando la cookie y enviando `X-CSRF-Token` o `_csrf` en la mutación. El campo `_csrf` se elimina antes de pasar el cuerpo al controlador.
4. Solo un JWT de cabecera ya verificado contra BD permite omitir CSRF. Una cabecera falsa o un JWT inválido devuelve 401; no basta su presencia.
5. Los clientes API sin usuario, sin cookie de sesión ni cabeceras de navegador pueden seguir llamando a los endpoints públicos sin CSRF. Esto no evita la autenticación/autoridad de las rutas protegidas. Los navegadores y las peticiones con cookies no tienen esta excepción.

CORS permite el propio origen y los orígenes exactos en `CORS_ORIGINS`, separados por comas. No acepta `*`, orígenes opacos ni comodines de subdominio. Las preflight incluyen autorización y CSRF. Los orígenes no autorizados reciben 403. `SameSite=Lax` se mantiene: para APIs entre sitios distintos se debe usar JWT, no depender de cookies de terceros.

Para páginas servidas directamente con `res.send`, plantillas ajenas que sustituyan `res.render` después de core o un cliente que no use XHR/fetch nativo, se debe integrar explícitamente `/api/csrf` y la cabecera. Las vistas EJS examinadas usan el mecanismo compartido.

## Compatibilidad de los cuatro consumidores

| Consumidor | Evidencia inspeccionada | Compatibilidad y acción necesaria |
| --- | --- | --- |
| `timetrack` | `app.js`, rutas, formularios y uso de `checkPermision`; `setup({deserializeUser})` añade `clubs`/`skater` | Se mantiene la firma y se prueba ese patrón con HTTP, Passport y MongoDB. Hereda CSRF/CORS y cambios de login/logout. El callback personalizado debe retornar su promesa para que sus fallos asíncronos puedan llegar a core; el actual no retorna la consulta y conviene corregirlo en ese repositorio |
| `icetimetrack` | `app.js` carga `timetrack/app`, define `__corePath` y `__modulesPath`; copia del deserializador | Mismas condiciones que timetrack; hay que actualizar su propio submódulo core y configurar su propio `PUBLIC_ORIGIN` |
| `inlinetimetrack` | Mismo arranque por `timetrack/app`, rutas de gestión y formularios | Mismas condiciones; no se cambian roles deportivos como `coach`/`skater` ni sus permisos. Revisar clientes externos y lista CORS por despliegue |
| `new-cpvrivas` | `app.js`, rutas con importaciones `node_modules/core`, layout y scripts locales, formulario multipart | Conserva enlace local `file:./core`, integra los tests de core en `npm test` y espera la inicialización. XHR multipart queda cubierto por la cabecera sin modificar el cuerpo FormData |

En todos ellos: revisar integraciones que dependan de errores 400 en vez de 401/403, enlaces de contraseña antiguos, apertura de logout sin confirmación, login automático por query, petición de permisos con JWT obsoleto, cuenta pendiente sin roles y orígenes externos antes admitidos por CORS abierto.

Las correcciones se han trasladado al módulo principal `repos/core`, que es la fuente de los consumidores. La implementación inicial también permanece en `new-cpvrivas/core`. Las otras copias y sus bases de datos no se han actualizado. La comprobación de compatibilidad es estática y mediante fixtures del contrato compartido; no se han arrancado ni desplegado las otras aplicaciones completas.

## Inicialización de una base vacía

Se elimina la credencial fija que creaba `initializeDB`. Si no hay usuarios, ahora hacen falta `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD`; `INITIAL_ADMIN_USERNAME` es opcional y por defecto vale `admin`. Se aplica la política de contraseña configurada. Estas variables no se guardan en configuración ni se imprimen; deben retirarse después del aprovisionamiento.

Si hay usuarios, no se crea ninguna cuenta ni se cambia la contraseña del administrador existente. Si una instalación antigua conserva la contraseña inicial conocida, se debe rotar desde el administrador: esta revisión no la cambia sin autorización.

La inicialización devuelve una promesa que cubre los datos semilla y sus errores. Los tres consumidores timetrack examinados ya la esperan; `new-cpvrivas` se ajusta para esperarla también.

## Verificación reproducible

Desde el repositorio principal:

```powershell
npm test
npm run test:integration
```

Desde core aislado con sus dependencias instaladas:

```powershell
npm test
npm run test:integration
```

`test:integration` arranca un `mongod` local solo en loopback, elige puerto y carpeta temporales, y elimina su propia base y carpeta al terminar. En Windows detecta las versiones instaladas de MongoDB en Program Files; se puede indicar `MONGOD_BINARY` en otra instalación. Alternativamente `SECURITY_TEST_MONGODB_URI` permite usar un servidor de pruebas con una base única `core_security_test_<aleatorio>` que se borra al finalizar. No utiliza `MONGODB_URI` de la aplicación.

Las pruebas de integración usan Express, EJS, Passport, sesiones persistidas con connect-mongo, Mongoose y MongoDB reales. Solo se sustituyen el envío de correo y los valores de configuración del entorno; se comprueban los enlaces capturados sin enviar mensajes. Incluyen consumo concurrente, caducidad, reemisión, registro web/API, cambio propio/ajeno/admin, búsquedas inyectadas, invalidación de sesiones/JWT, logout y login por query, callback deportivo y cookies Secure tras proxy.

Los casos de seguridad de la antigua prueba del consumidor se trasladan a `core/test` para probar los servicios reales y evitar dobles simulaciones divergentes. Se mantienen las regresiones locales de anuncios, agenda y controladores.

## Resultados de esta revisión

| Ejecución | Resultado |
| --- | --- |
| npm test, entorno local Node 26.13.0 | 64 de 64 correctas |
| npm run test:integration, MongoDB 8.0 temporal | 19 de 19 correctas |
| Ejecución conjunta con Node 24.22.2 temporal | 83 de 83 correctas, sin pruebas omitidas |
| JavaScript y EJS | Comprobación de sintaxis incluida en la suite local |

El ejecutable temporal de Node 24 se obtuvo para las pruebas sin sustituir el Node del equipo ni modificar las dependencias de la aplicación. Los logs completos se conservan en la carpeta security-review del consumidor.

## Despliegue y límites

1. Revisar los cambios en estas ramas. Configurar `PUBLIC_ORIGIN`, secretos de sesión/JWT, MongoDB y CORS antes de actualizar producción. Las credenciales de bootstrap solo son necesarias para bases nuevas.
2. Se han probado Node 24.22.2 (línea declarada por el consumidor) y el entorno local Node 26.13.0. Confirmar entrega SMTP y la URL pública en staging.
3. Confirmar y publicar primero el commit de core en su rama remota. Solo después actualizar el gitlink de cada consumidor a un commit alcanzable y publicar/desplegar cada consumidor. No se han hecho commits ni pushes automáticamente.
4. Los enlaces basados en salt no deben reactivarse al revertir: una reversión a core antiguo restaura el fallo original. Preferir una corrección hacia delante si aparece una incompatibilidad.

Esto cubre los siete hallazgos solicitados y los fallos de inicialización vinculados. No es una certificación de toda la aplicación: quedan fuera de esta entrega el cambio de KDF legado (PBKDF2 de 1000 iteraciones), una política de rate limiting/brute force, la unicidad transaccional de username/email, los callbacks no retornados de repositorios hermanos y una auditoría de las restantes consultas genéricas. Las actualizaciones de dependencias requieren una revisión separada.

## Referencias de diseño

- [OWASP: recuperación de contraseña](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html): tokens aleatorios, con expiración y de un solo uso.
- [MongoDB: atomicidad de escritura](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/): actualización de un documento con condiciones sobre el estado esperado.
- [OWASP: prevención CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html): token sincronizado y SameSite como defensa adicional.
- [Express: sesiones](https://expressjs.com/en/resources/middleware/session/): cookie segura, confianza del proxy, `saveUninitialized` y almacenamiento persistente.
