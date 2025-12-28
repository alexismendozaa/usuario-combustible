import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateMaintenanceItemDto {
  @IsString()
  vehicleId!: string;

  @IsString()
  @MinLength(2)
  title!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  intervalKm?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  intervalMonths?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  lastDoneOdometerKm?: number;

  @IsOptional()
  @IsString() // ISO date
  lastDoneAt?: string;
}
