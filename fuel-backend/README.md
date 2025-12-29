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

## API Endpoints

- **Autenticación (público salvo donde se indica)**
  - `POST /auth/register` → `{ email, password, name? }`
  - `POST /auth/login` → `{ email, password }` (devuelve access + refresh token).
  - `GET /auth/me` → requiere `Authorization: Bearer <accessToken>`.
  - `POST /auth/verify-email` → `{ token }` (token recibido por correo).
  - `GET /auth/verify-email/confirm/:token` → confirma desde enlace público.
  - `POST /auth/forgot-password` → `{ email }` envía correo de reseteo.
  - `POST /auth/reset-password` → `{ token, newPassword }` usa token del correo.
  - `GET /auth/reset-password/confirm/:token` → devuelve formulario HTML para actualizar la contraseña.
  - `POST /auth/reset-password/confirm/:token` → `{ newPassword }` vía formulario (HTML).
  - `POST /auth/refresh` → `{ refreshToken }` obtiene nuevo access token.
  - `POST /auth/logout` → `{ refreshToken }` invalida refresh.

- **Vehículos** (token requerido `Authorization: Bearer <accessToken>`, prefijo `/vehicles`)
  - `POST /` crear → `{ name, brand?, model?, year?, plate?, fuelType?, odometerKm? }`
  - `GET /` listar propios.
  - `GET /:id` obtener detalle.
  - `PATCH /:id` actualizar → mismos campos todos opcionales.
  - `DELETE /:id` eliminar.

- **Cargas de combustible** (token requerido, prefijo `/refuels`)
  - `POST /` crear → `{ vehicleId, filledAt?, odometerKm, liters, totalCost, note?, lat?, lng? }`
  - `GET /` listar, opcional `?vehicleId=`.
  - `GET /:id` obtener.
  - `PATCH /:id` actualizar → mismos campos opcionales.
  - `DELETE /:id` eliminar.

- **Mantenimiento** (token requerido, prefijo `/maintenance`)
  - `POST /items` crear tarea → `{ vehicleId, title, notes?, intervalKm?, intervalMonths?, lastDoneOdometerKm?, lastDoneAt? }`
  - `GET /items` listar, opcional `?vehicleId=`.
  - `GET /items/:id` obtener.
  - `PATCH /items/:id` actualizar → mismos campos opcionales.
  - `DELETE /items/:id` eliminar.
  - `POST /items/:id/log` marcar como realizado → `{ doneAt?, odometerKm?, cost?, note? }`.
  - `GET /items/:id/logs` historial de logs.
  - `GET /due` pendientes, opcional `?vehicleId=` y `?odometerKm=` (para calcular próximos).

- **Reportes** (token requerido, prefijo `/reports`)
  - `GET /vehicles/:vehicleId/summary` resumen de gastos y totales.
  - `GET /vehicles/:vehicleId/monthly?month=YYYY-MM` métricas mensuales.
  - `GET /vehicles/:vehicleId/timeline?limit=50` eventos ordenados (limit opcional).

- **Rutas (GPS)** (token requerido, prefijo `/routes`)
  - `POST /` crear ruta → `{ vehicleId?, name?, points: [{ lat, lng, ts(ISO) }, ...] }`
  - `GET /` listar rutas del usuario (resumen)
  - `GET /:id` obtener ruta completa (incluye `points`)
  - `DELETE /:id` eliminar ruta

- **Estaciones (Público)** (prefijo `/stations`)
  - `GET /nearby?lat=<num>&lng=<num>&radius=<num?>` estaciones cercanas.
    - Parámetros:
      - `lat` (requerido): latitud en grados decimales. Ej: `19.4326`
      - `lng` (requerido): longitud en grados decimales. Ej: `-99.1332`
      - `radius` (opcional): radio en metros (200–10000). Por defecto `2000`.
    - Respuesta (ejemplo): `{ count, stations: [{ id, name, brand?, operator?, lat, lng, address? }] }`

- **Salud**
  - `GET /` responde string de prueba.

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

# Correo
MAIL_HOST="smtp.ejemplo.com"
MAIL_PORT=587
MAIL_USER="tu_email@ejemplo.com"
MAIL_PASSWORD="tu_password"
```

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

- Documentación interactiva: http://localhost:3000/docs
- Auth en Swagger: usa el botón "Authorize" con `Bearer <accessToken>`.

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
