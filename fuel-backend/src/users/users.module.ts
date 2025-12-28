import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersAvatarService } from './users.avatar.service';
import { UsersAvatarController } from './users.avatar.controller';

@Module({
  providers: [UsersService, UsersAvatarService],
  controllers: [UsersController, UsersAvatarController],
  exports: [UsersService],
})
export class UsersModule {}
