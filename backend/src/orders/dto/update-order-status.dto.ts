import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsNotEmpty()
  @IsString()
  @IsIn([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'PACKED',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'RETURN_REQUESTED',
    'RETURNED',
    'REFUNDED',
  ])
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
