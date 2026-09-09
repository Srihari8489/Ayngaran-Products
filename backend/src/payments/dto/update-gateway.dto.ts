import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateGatewayDto {
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['TEST', 'LIVE'])
  mode?: string;

  @IsOptional()
  @IsString()
  keyId?: string;

  @IsOptional()
  @IsString()
  secretKey?: string; // will be AES-256-GCM encrypted

  @IsOptional()
  @IsString()
  webhookSecret?: string; // will be AES-256-GCM encrypted
}
