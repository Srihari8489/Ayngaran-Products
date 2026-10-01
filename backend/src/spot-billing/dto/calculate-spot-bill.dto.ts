import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsIn,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SpotBillItemDto } from './create-spot-bill.dto';

export class CalculateSpotBillDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpotBillItemDto)
  items: SpotBillItemDto[];

  @IsOptional()
  @IsIn(['FIXED', 'PERCENTAGE'])
  discountType?: 'FIXED' | 'PERCENTAGE';

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @IsOptional()
  @IsString()
  customerState?: string; // Default: 'Tamil Nadu'
}
