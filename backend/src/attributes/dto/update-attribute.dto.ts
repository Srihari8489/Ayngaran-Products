import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateAttributeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  @IsIn(['text', 'number', 'boolean', 'single_select', 'multi_select', 'range'])
  dataType?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
