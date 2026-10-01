import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsIn,
  Min,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SpotBillItemDto {
  @IsNumber()
  productId: number;

  @IsOptional()
  @IsNumber()
  variantId?: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;
}

export class CreateSpotBillDto {
  @IsOptional()
  @IsNumber()
  customerId?: number;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerGstin?: string;

  @IsOptional()
  @IsString()
  customerAddress?: string;

  @IsOptional()
  @IsString()
  customerState?: string; // Default: 'Tamil Nadu'

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

  @IsIn(['CASH', 'UPI', 'CARD', 'OTHER'])
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'OTHER';

  @IsOptional()
  @IsNumber()
  @Min(0)
  amountReceived?: number;

  @IsOptional()
  @IsString()
  paymentReference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
