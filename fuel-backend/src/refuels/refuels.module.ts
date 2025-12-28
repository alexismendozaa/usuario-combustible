import { Module } from '@nestjs/common';
import { RefuelsController } from './refuels.controller';
import { RefuelsService } from './refuels.service';

@Module({
  controllers: [RefuelsController],
  providers: [RefuelsService]
})
export class RefuelsModule {}
