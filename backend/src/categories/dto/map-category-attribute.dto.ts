import { IsBoolean, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class MapCategoryAttributeDto {
  @IsNotEmpty()
  @IsInt()
  attributeId: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  isFilterable?: boolean;

  @IsOptional()
  @IsBoolean()
  isVariant?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
