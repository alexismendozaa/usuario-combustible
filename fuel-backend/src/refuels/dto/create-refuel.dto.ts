import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateRefuelDto {
  @IsString()
  vehicleId!: string;

  @IsOptional()
  @IsDateString()
  filledAt?: string; // ISO

  @IsInt()
  @Min(0)
  odometerKm!: number;

  @IsNumber()
  @Min(0.001)
  liters!: number;

  @IsNumber()
  @Min(0)
  totalCost!: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;
}
