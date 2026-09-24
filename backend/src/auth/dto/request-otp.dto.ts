import { IsOptional, IsString } from 'class-validator';

export class RequestOtpDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  identifier?: string;

  @IsOptional()
  @IsString()
  name?: string;
}
