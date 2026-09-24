import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  identifier?: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  otp: string;

  @IsOptional()
  @IsString()
  name?: string;
}
