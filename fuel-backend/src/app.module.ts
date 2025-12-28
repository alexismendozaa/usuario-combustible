import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './auth/mail/mail.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { RefuelsModule } from './refuels/refuels.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    MailModule,
    VehiclesModule,
    RefuelsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
