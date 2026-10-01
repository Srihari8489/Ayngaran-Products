import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReturnItemDto {
  @Type(() => Number)
  @IsNumber()
  spotBillItemId: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class ReturnSpotBillDto {
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  refundMethod?: string; // CASH, UPI, CARD

  @IsOptional()
  @IsString()
  refundReference?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];
}
