import { PartialType } from '@nestjs/swagger';
import { CreateMaintenanceItemDto } from './create-maintenance-item.dto';

export class UpdateMaintenanceItemDto extends PartialType(CreateMaintenanceItemDto) {}
