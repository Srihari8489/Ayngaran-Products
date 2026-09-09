import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class StaffLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
