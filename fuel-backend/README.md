<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## 🚗 Combustible API - Sistema de Gestión de Vehículos

API completa para la gestión integral de vehículos, combustible, mantenimiento y pagos. Diseñada con NestJS, PostgreSQL, Prisma y Stripe.

### ✨ Características principales

- 🔐 **Autenticación JWT** - Sistema completo con access/refresh tokens
- 📧 **Verificación de Email** - Confirmación de cuenta vía correo electrónico
- 🔑 **Recuperación de contraseña** - Flujo completo con tokens de seguridad
- 🚙 **Gestión de Vehículos** - CRUD completo con información detallada
- ⛽ **Registro de Combustible** - Seguimiento de cargas con ubicación GPS
- 🔧 **Mantenimientos** - Programación y recordatorios automáticos
- 📊 **Reportes y Analytics** - Estadísticas de consumo y gastos
- 🗺️ **Rutas GPS** - Almacenamiento de trayectos con coordenadas
- 🏪 **Estaciones Cercanas** - Búsqueda de gasolineras por ubicación
- 💳 **Pagos con Stripe** - Checkout Sessions con vouchers automáticos
- 📬 **Sistema de Emails** - Notificaciones y vouchers HTML
- �️ **Subida de Avatares** - Almacenamiento de fotos de perfil (S3 compatible)
- �📝 **Documentación Swagger** - API docs interactiva y completa

### 🛠️ Stack Tecnológico

- **Backend**: NestJS (Node.js + TypeScript)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT (access + refresh tokens)
- **Emails**: Nodemailer (SMTP)
- **Pagos**: Stripe API (Checkout + Webhooks)
- **Docs**: Swagger/OpenAPI
- **Validation**: class-validator + class-transformer

---

---

## API Endpoints

### Autenticación (público salvo donde se indica)
- `POST /auth/register` → `{ email, password, name? }`
- `POST /auth/login` → `{ email, password }` (devuelve access + refresh token)
- `GET /auth/me` → requiere `Authorization: Bearer <accessToken>`
- `POST /auth/verify-email` → `{ token }` (token recibido por correo)
- `GET /auth/verify-email/confirm/:token` → confirma desde enlace público
- `POST /auth/forgot-password` → `{ email }` envía correo de reseteo
- `POST /auth/reset-password` → `{ token, newPassword }` usa token del correo
- `GET /auth/reset-password/confirm/:token` → devuelve formulario HTML para actualizar la contraseña
- `POST /auth/reset-password/confirm/:token` → `{ newPassword }` vía formulario (HTML)
- `POST /auth/refresh` → `{ refreshToken }` obtiene nuevo access token
- `POST /auth/logout` → `{ refreshToken }` invalida refresh

### Vehículos (requiere autenticación)
**Prefijo**: `/vehicles`

- `POST /` crear → `{ name, brand?, model?, year?, plate?, fuelType?, odometerKm? }`
- `GET /` listar propios
- `GET /:id` obtener detalle
- `PATCH /:id` actualizar → mismos campos todos opcionales
- `DELETE /:id` eliminar

### Cargas de combustible (requiere autenticación)
**Prefijo**: `/refuels`

- `POST /` crear → `{ vehicleId, filledAt?, odometerKm, liters, totalCost, note?, lat?, lng? }`
- `GET /` listar, opcional `?vehicleId=`
- `GET /:id` obtener
- `PATCH /:id` actualizar → mismos campos opcionales
- `DELETE /:id` eliminar

### Mantenimiento (requiere autenticación)
**Prefijo**: `/maintenance`

- `POST /items` crear tarea → `{ vehicleId, title, notes?, intervalKm?, intervalMonths?, lastDoneOdometerKm?, lastDoneAt? }`
- `GET /items` listar, opcional `?vehicleId=`
- `GET /items/:id` obtener
- `PATCH /items/:id` actualizar → mismos campos opcionales
- `DELETE /items/:id` eliminar
- `POST /items/:id/log` marcar como realizado → `{ doneAt?, odometerKm?, cost?, note? }`
- `GET /items/:id/logs` historial de logs
- `GET /due` pendientes, opcional `?vehicleId=` y `?odometerKm=` (para calcular próximos)

### Reportes (requiere autenticación)
**Prefijo**: `/reports`

- `GET /vehicles/:vehicleId/summary` resumen de gastos y totales
- `GET /vehicles/:vehicleId/monthly?month=YYYY-MM` métricas mensuales
- `GET /vehicles/:vehicleId/timeline?limit=50` eventos ordenados (limit opcional)

### Rutas (GPS) (requiere autenticación)
**Prefijo**: `/routes`

- `POST /` crear ruta → `{ vehicleId?, name?, points: [{ lat, lng, ts(ISO) }, ...] }`
- `GET /` listar rutas del usuario (resumen)
- `GET /:id` obtener ruta completa (incluye `points`)
- `DELETE /:id` eliminar ruta

### Estaciones (público)
**Prefijo**: `/stations`

- `GET /nearby?lat=<num>&lng=<num>&radius=<num?>` estaciones cercanas
  - **Parámetros**:
    - `lat` (requerido): latitud en grados decimales. Ej: `19.4326`
    - `lng` (requerido): longitud en grados decimales. Ej: `-99.1332`
    - `radius` (opcional): radio en metros (200–10000). Por defecto `2000`
  - **Respuesta**: `{ count, stations: [{ id, name, brand?, operator?, lat, lng, address? }] }`

### Pagos / Stripe
**Prefijo**: `/payments`

- `POST /checkout` (requiere autenticación) → crear sesión de pago
  - **Body**: `{ amountCents: number, description?: string }`
  - **Respuesta**: `{ paymentId: string, checkoutUrl: string }`
  - El usuario debe visitar `checkoutUrl` para completar el pago en Stripe
  - Al completar el pago:
    - El webhook crea una factura en Stripe
    - Stripe enviará automáticamente el recibo oficial por email
    - El pago se marca como "paid" en la base de datos
- `GET /` (requiere autenticación) → listar historial de pagos del usuario
- `POST /webhook` (público, solo para Stripe) → webhook de eventos Stripe
  - Verifica firma con `STRIPE_WEBHOOK_SECRET`
  - Procesa `checkout.session.completed` para:
    - Marcar el pago como completado en la base de datos
    - Crear una factura en Stripe (que genera el recibo oficial)
    - Stripe envía automáticamente el recibo por correo electrónico

### Usuario (requiere autenticación)
**Prefijo**: `/users/me`

- `GET /` → obtener perfil del usuario autenticado
  - **Respuesta**: `{ userId, email, name?, avatarUrl? }`
- `PATCH /name` → actualizar nombre del usuario
  - **Body**: `{ name: string }`
  - **Respuesta**: `{ id, email, name, avatarUrl }`
- `PATCH /email` → solicitar cambio de email
  - **Body**: `{ newEmail: string }`
  - **Respuesta**: `{ message: "Se ha enviado un correo de verificación a nuevo@ejemplo.com..." }`
  - **Flujo**: 
    1. Usuario solicita cambio con el nuevo email
    2. Se envía un correo de verificación al NUEVO email
    3. Usuario confirma el enlace recibido (GET automático al hacer clic)
    4. El email se actualiza en la base de datos
- `GET /email/confirm/:token` → confirmar cambio de email
  - **Parámetro**: `token` (recibido en el correo de verificación)
  - **Acceso**: Vía enlace público en el correo (no requiere autenticación)
  - **Respuesta**: `{ id, email, name, message: "Email actualizado correctamente" }`
- `PATCH /password` → cambiar contraseña del usuario
  - **Body**: `{ currentPassword: string, newPassword: string }`
  - **Respuesta**: `{ ok: true, message: "Contraseña actualizada correctamente" }`
  - **Nota**: Requiere verificar la contraseña actual para mayor seguridad
- `DELETE /` → eliminar cuenta del usuario
  - **Respuesta**: `{ ok: true, message: "Cuenta eliminada correctamente" }`
  - **Nota**: Esta acción es permanente y eliminará todos los datos asociados al usuario

**Avatar**: `/users/me/avatar`

- `POST /` → subir/reemplazar avatar
  - **Content-Type**: `multipart/form-data`
  - **Field**: `file` (imagen JPG, PNG o WebP)
  - **Límite**: 5MB máximo
  - **Respuesta**: `{ ok: true, user: { id, email, name?, avatarUrl } }`
  - Las imágenes se almacenan en un servidor de archivos estático (compatible con S3)
- `GET /` → obtener URL del avatar actual
- `DELETE /` → eliminar avatar del usuario

### Salud
- `GET /` responde string de prueba

---

## Project setup

```bash
$ npm install
```

## Database Setup (Prisma)

Este proyecto usa Prisma como ORM con PostgreSQL. Asegúrate de tener PostgreSQL instalado y configurado.

### 1. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto con la siguiente configuración:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/nombre_db?schema=public"

# JWT (access)
JWT_ACCESS_SECRET="tu_secreto_access"
ACCESS_TOKEN_TTL=900          # 15 minutos en segundos

# JWT (refresh)
JWT_REFRESH_SECRET="tu_secreto_refresh"
REFRESH_TOKEN_TTL=2592000     # 30 días en segundos

# Correo (SMTP)
SMTP_HOST="smtp.ejemplo.com"
SMTP_PORT=587
SMTP_USER="tu_email@ejemplo.com"
SMTP_PASS="tu_password"
MAIL_FROM="noreply@tuapp.com"  # Opcional, usa SMTP_USER si no se define
APP_PUBLIC_URL="http://localhost:3000"  # URL base para enlaces en emails

# Stripe (Pagos)
STRIPE_SECRET_KEY="sk_test_..."           # Clave secreta de Stripe (Test mode)
STRIPE_WEBHOOK_SECRET="whsec_..."         # Secret del webhook (obtener de Stripe CLI o Dashboard)
STRIPE_CURRENCY="usd"                     # Moneda por defecto (usd, mxn, eur, etc.)
STRIPE_SUCCESS_URL="http://localhost:3000/payment/success"  # Redirección al completar pago
STRIPE_CANCEL_URL="http://localhost:3000/payment/cancel"    # Redirección al cancelar pago

# S3 / Almacenamiento de Archivos (Avatares)
S3_PUBLIC_BASE_URL="http://localhost:3001"  # URL base del servidor de archivos (puede ser S3, Cloudflare R2, o servidor local)
S3_UPLOAD_PREFIX="uploads/avatars"          # Prefijo para organizar archivos (opcional, default: uploads/avatars)
```

> **Nota sobre almacenamiento**: Este proyecto usa un servidor de archivos compatible con S3 API para subir avatares. Puedes usar:
> - **Desarrollo local**: Un servidor HTTP simple que acepte PUT/DELETE (ej: `python -m http.server 3001`)
> - **S3**: AWS S3 con URLs pre-firmadas
> - **Cloudflare R2**: Compatible con S3 API
> - **MinIO**: Servidor de almacenamiento de objetos auto-hospedado

### 2. Habilitar extensión pgcrypto en PostgreSQL

Antes de ejecutar las migraciones, conecta a tu base de datos PostgreSQL y ejecuta:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

Esto es necesario para generar UUIDs con `gen_random_uuid()`.

### 3. Ejecutar migraciones de Prisma

```bash
# Eliminar base de datos y recrearla con todas las migraciones (CUIDADO: esto borra todos los datos)
$ npx prisma migrate reset

# O aplicar migraciones pendientes sin borrar datos
$ npx prisma migrate deploy

# O crear una nueva migración después de cambios en schema.prisma
$ npx prisma migrate dev --name nombre_de_tu_migracion
```

Si ves el error P3009 (migración fallida en destino), puedes rebaselinar en desarrollo:

```bash
# 1) (opcional) Habilitar pgcrypto si no existe
psql "$DATABASE_URL" -c 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";'

# 2) Eliminar la migración fallida local y crear una inicial desde el schema actual
rm -rf prisma/migrations/*
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Generar Prisma Client

Después de las migraciones, genera el cliente de Prisma:

```bash
$ npx prisma generate
```

### 5. (Opcional) Abrir Prisma Studio para ver/editar datos

```bash
$ npx prisma studio
```

## Stripe Setup (Pagos)

Este proyecto integra Stripe para procesar pagos mediante Checkout Sessions. Sigue estos pasos para configurar Stripe:

### 1. Crear cuenta en Stripe

1. Regístrate en [Stripe](https://stripe.com)
2. Activa el **modo Test** (toggle en el Dashboard)
3. Obtén tus claves API desde [API Keys](https://dashboard.stripe.com/test/apikeys):
   - `STRIPE_SECRET_KEY` (comienza con `sk_test_...`)

### 2. Configurar Webhook Local (desarrollo)

Para probar webhooks localmente, usa **Stripe CLI**:

```bash
# Instalar Stripe CLI (macOS)
brew install stripe/stripe-cli/stripe

# Autenticar
stripe login

# Escuchar webhooks y reenviarlos a tu servidor local
stripe listen --forward-to localhost:3000/payments/webhook
```

Esto te dará un **webhook signing secret** (`whsec_...`). Cópialo y agrégalo a tu `.env` como `STRIPE_WEBHOOK_SECRET`.

### 3. Probar el flujo de pago

1. **Crear Checkout**: `POST /payments/checkout` con `{ amountCents: 5000, description: "Test" }`
2. **Completar pago**: Visita el `checkoutUrl` retornado
3. **Usar tarjeta de prueba**: `4242 4242 4242 4242` (fecha futura, cualquier CVC)
4. **Verificar webhook**: El webhook procesará `checkout.session.completed` y:
   - Marcará el pago como `paid` en tu DB
   - Enviará un voucher HTML por email

### 4. Webhooks en producción

1. Crea un webhook endpoint en [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. URL: `https://tudominio.com/payments/webhook`
3. Eventos: Selecciona `checkout.session.completed`
4. Copia el **Signing Secret** y úsalo como `STRIPE_WEBHOOK_SECRET` en producción

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Swagger

- **Documentación interactiva**: http://localhost:3000/docs
- **Autenticación en Swagger**: 
  1. Regístrate/inicia sesión para obtener un `accessToken`
  2. Haz clic en el botón **"Authorize"** (🔓 arriba a la derecha)
  3. Ingresa: `Bearer {tu-accessToken}` (ejemplo: `Bearer eyJhbGc...`)
  4. Haz clic en "Authorize" y luego "Close"
  5. Ahora puedes probar todos los endpoints protegidos

### Endpoints disponibles en Swagger

- **Auth**: Registro, login, verificación de email, recuperación de contraseña
- **Vehículos**: CRUD completo de vehículos
- **Cargas de Combustible**: Registro y gestión de recargas
- **Mantenimiento**: Programación y seguimiento de mantenimientos
- **Reportes**: Estadísticas y análisis por vehículo
- **Rutas**: Almacenar y consultar rutas GPS
- **Estaciones**: Buscar estaciones de gasolina cercanas
- **Pagos / Stripe**: Crear checkouts y ver historial de pagos
- **Usuario**: Gestión de perfil y avatar
- **Avatar**: Subir/eliminar foto de perfil (hasta 5MB)

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
