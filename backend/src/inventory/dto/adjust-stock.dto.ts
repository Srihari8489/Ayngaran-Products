import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AdjustStockDto {
  @IsInt()
  @IsNotEmpty()
  productId: number;

  @IsOptional()
  @IsInt()
  variantId?: number;

  @IsNotEmpty()
  @IsString()
  @IsIn(['RESTOCK', 'ADJUSTMENT', 'RETURN', 'DAMAGE'])
  type: string;

  @IsInt()
  @IsNotEmpty()
  quantityChange: number; // positive or negative integer

  @IsOptional()
  @IsString()
  reason?: string;
}
