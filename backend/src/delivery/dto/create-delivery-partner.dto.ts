import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDeliveryPartnerDto {
  @IsNotEmpty()
  @IsString()
  partnerCode: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  trackingUrlTemplate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
