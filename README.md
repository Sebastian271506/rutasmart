# RutaSmart — base SaaS web B2B

Este monorepo agrega una base escalable para evolucionar el prototipo estático existente. No implementa ni requiere aplicaciones nativas.

## Arquitectura inicial

```text
apps/
  web/                 Next.js + React + Tailwind: panel B2B y futuras páginas de tracking
    app/               Rutas, layout, estilos y página inicial
    components/        UI interactiva; MapLive consume Socket.IO
  api/                 Express + Socket.IO: API HTTP y eventos en tiempo real
    src/auth.ts        Validación JWT para HTTP y WebSocket
    src/realtime.ts    Aislamiento por tenant, snapshots y actualizaciones de ubicación
    src/server.ts      Servidor, Redis adapter y health check
packages/
  shared/              Tipos/validaciones compartidos (siguiente paso)
infra/
  docker-compose.yml   PostGIS y Redis para desarrollo local
index.html             Prototipo estático anterior, conservado
script.js
styles.css
```

El servidor autentica el handshake con JWT. El `tenantId` y el `sub` provienen del token firmado; nunca se aceptan del payload de ubicación. Dueño/operador entra a la sala de mapa de su negocio. El domiciliario solo puede publicar su propia ubicación y no se une a la sala que recibe coordenadas. Redis guarda ubicaciones con TTL de 90 segundos y el adapter de Socket.IO distribuye eventos entre instancias. Una instalación multiinstancia necesita sticky sessions o WebSocket-only en el proxy, y Redis disponible.

El tracking público por pedido debe usar un token aleatorio de acceso limitado, separado del JWT de administración. No se debe exponer el ID interno del pedido como autorización.

## Requisitos

- Node.js 20+
- Docker Desktop con Compose

## Arranque local

1. `docker compose up -d`
2. Copia `apps\api\.env.example` a `apps\api\.env` y define `JWT_SECRET` como una cadena aleatoria de al menos 32 caracteres.
3. Copia `apps\web\.env.example` a `apps\web\.env.local`.
4. `npm install`
5. `npm run dev`

Web: `http://localhost:3000`; API: `http://localhost:4000/healthz`.

No hay emisión de tokens ni interfaz de login conectada todavía: la API solo valida JWT con `issuer=rutasmart-api`, `audience=rutasmart-web`, `algorithm=HS256`, `sub`, `tenantId` y rol `owner`, `operator` o `courier`. La página web espera que la futura sesión administrativa le pase un token de forma segura; no se guarda un token de prueba en el navegador.

## Protocolo Socket.IO del mapa

Handshake:

```ts
io("http://localhost:4000", { auth: { token: accessToken } });
```

Domiciliario autenticado (`role=courier`) publica:

```ts
socket.emit("courier:location:update", {
  latitude: 7.8891,
  longitude: -72.4967,
  accuracyMeters: 12,
  headingDegrees: 90
});
```

El servidor deriva tenant y domiciliario del JWT, valida coordenadas, limita publicaciones a una por segundo, cachea la última ubicación con TTL y emite al tenant correspondiente:

- `map:couriers:snapshot` al conectar dueño/operador.
- `map:courier:location` al recibir cada ubicación.
- `realtime:error` ante datos inválidos o errores de lectura/escritura.

## Próximos pasos recomendados

1. Implementar registro del negocio, usuarios, roles y emisión/renovación segura de sesión.
2. Añadir capa de acceso a PostgreSQL/PostGIS y migraciones para tenants, pedidos, pagos y auditoría.
3. Conectar geocodificación/mapas y persistir tracking con retención y consentimiento adecuados.
4. Añadir pruebas de integración que verifiquen aislamiento entre tenants y permisos.
5. Crear enlaces de tracking público firmados, de corta exposición y con datos mínimos.
