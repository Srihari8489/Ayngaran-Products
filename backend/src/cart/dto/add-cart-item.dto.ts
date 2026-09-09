import { IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class AddCartItemDto {
  @IsInt()
  @IsNotEmpty()
  productId: number;

  @IsOptional()
  @IsInt()
  variantId?: number;

  @IsInt()
  @Min(1)
  quantity: number;
}
