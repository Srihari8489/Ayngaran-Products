import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CheckoutAddressDto {
  @IsNotEmpty()
  @IsString()
  recipientName: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  addressLine1: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsNotEmpty()
  @IsString()
  pincode: string;
}

export class CheckoutItemInputDto {
  @IsInt()
  @IsNotEmpty()
  productId: number;

  @IsOptional()
  @IsInt()
  variantId?: number;

  @IsInt()
  @IsNotEmpty()
  quantity: number;
}

export class CheckoutDto {
  @IsOptional()
  @IsInt()
  addressId?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CheckoutAddressDto)
  newAddress?: CheckoutAddressDto;

  @IsNotEmpty()
  @IsString()
  @IsIn(['COD', 'MOCK', 'RAZORPAY'])
  paymentMethod: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemInputDto)
  items?: CheckoutItemInputDto[];
}
