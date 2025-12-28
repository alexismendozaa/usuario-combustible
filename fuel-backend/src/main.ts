import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import express from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(express.urlencoded({ extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Combustible API')
    .setDescription(`
## API de Gestión de Vehículos y Combustible

Esta API permite gestionar vehículos, registrar cargas de combustible, programar mantenimientos y generar reportes.

### Autenticación
La mayoría de los endpoints requieren autenticación mediante Bearer Token (JWT).

**Pasos para autenticarte:**
1. Registra un usuario en \`POST /auth/register\`
2. Verifica tu email (revisa el correo o usa el token directamente)
3. Inicia sesión en \`POST /auth/login\` para obtener el **accessToken**
4. Haz clic en el botón **"Authorize"** arriba a la derecha
5. Ingresa: \`Bearer {tu-accessToken}\` (ejemplo: \`Bearer eyJhbGc...\`)
6. Haz clic en "Authorize" y luego "Close"

### Endpoints disponibles

#### Públicos (No requieren autenticación)
- **Auth**: Registro, login, verificación de email, recuperación de contraseña

#### Protegidos (Requieren Bearer Token)
- **Vehículos**: CRUD de vehículos
- **Combustible**: Registro de cargas
- **Mantenimiento**: Programación y seguimiento
- **Reportes**: Estadísticas y análisis
- **Usuario**: Perfil y avatar

### Ejemplos
Todos los endpoints tienen ejemplos de request/response. Solo copia, modifica los IDs y envía.
    `)
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      description: 'Ingresa tu JWT token. Formato: Bearer {token}',
      in: 'header',
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT || 3000);
}
void bootstrap();
