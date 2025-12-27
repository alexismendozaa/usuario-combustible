import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsInt()
  @Min(1950)
  @Max(2100)
  year?: number;

  @IsOptional()
  @IsString()
  plate?: string;

  @IsOptional()
  @IsString()
  fuelType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  odometerKm?: number;
}
