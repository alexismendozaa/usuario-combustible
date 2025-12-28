import { PartialType } from '@nestjs/swagger';
import { CreateRefuelDto } from './create-refuel.dto';

export class UpdateRefuelDto extends PartialType(CreateRefuelDto) {}
