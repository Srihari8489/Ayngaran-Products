import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductAttributeInputDto {
  @IsInt()
  @IsNotEmpty()
  attributeId: number;

  @IsOptional()
  @IsInt()
  attributeValueId?: number;

  @IsOptional()
  @IsString()
  valueText?: string;

  @IsOptional()
  @IsNumber()
  valueNumber?: number;

  @IsOptional()
  @IsBoolean()
  valueBoolean?: boolean;
}

export class VariantAttributeMappingDto {
  @IsInt()
  @IsNotEmpty()
  attributeId: number;

  @IsInt()
  @IsNotEmpty()
  attributeValueId: number;
}

export class CreateVariantDto {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsInt()
  @IsNotEmpty()
  stockQuantity: number;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantAttributeMappingDto)
  attributes: VariantAttributeMappingDto[];
}

export class ProductImageDto {
  @IsNotEmpty()
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  altText?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateProductDto {
  @IsOptional()
  @IsString()
  productCode?: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @IsInt()
  @IsNotEmpty()
  brandId: number;

  @IsNumber()
  @IsNotEmpty()
  basePrice: number;

  @IsOptional()
  @IsInt()
  minStockAlert?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeInputDto)
  attributes?: ProductAttributeInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];
}
