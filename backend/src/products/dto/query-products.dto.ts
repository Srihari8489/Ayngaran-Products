import { IsOptional, IsString } from 'class-validator';

export class QueryProductsDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  minPrice?: string;

  @IsOptional()
  @IsString()
  maxPrice?: string;

  @IsOptional()
  @IsString()
  sort?: string; // 'price_asc' | 'price_desc' | 'newest' | 'rating'

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  // JSON string or query parameter for dynamic attribute filters, e.g. {"ram": "12 GB", "storage": "256 GB"}
  @IsOptional()
  @IsString()
  attrs?: string;
}
