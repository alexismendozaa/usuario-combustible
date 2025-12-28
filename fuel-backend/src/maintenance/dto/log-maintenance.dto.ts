import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class LogMaintenanceDto {
  @IsOptional()
  @IsDateString()
  doneAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  odometerKm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
