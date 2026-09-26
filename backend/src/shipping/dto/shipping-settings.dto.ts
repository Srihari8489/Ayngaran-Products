import { IsNumber, IsString, IsNotEmpty, Min, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateShippingSettingsDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Tamil Nadu rate must be greater than or equal to 0' })
  tamilNaduRatePerKg: number;

  @IsString()
  @IsNotEmpty({ message: 'Tamil Nadu delivery time is required' })
  tamilNaduDeliveryTime: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Outside Tamil Nadu rate must be greater than or equal to 0' })
  outsideTnRatePerKg: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Minimum delivery days must be at least 1' })
  outsideTnMinDays: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Maximum delivery days must be at least 1' })
  outsideTnMaxDays: number;

  @IsOptional()
  @IsString()
  outsideTnDeliveryTime?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Base weight must be greater than 0' })
  baseWeightGrams: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
