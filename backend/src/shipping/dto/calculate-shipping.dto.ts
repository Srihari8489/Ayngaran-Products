import { IsOptional, IsNumber, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CartItemWeightDto {
  @IsOptional()
  @IsNumber()
  productId?: number;

  @IsOptional()
  @IsNumber()
  variantId?: number;

  @Type(() => Number)
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  weight?: number;
}

export class CalculateShippingDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  addressId?: number;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  destinationState?: string;

  @IsOptional()
  @IsString()
  destinationStateCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalWeightGrams?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemWeightDto)
  items?: CartItemWeightDto[];
}
