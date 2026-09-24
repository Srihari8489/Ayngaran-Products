import { IsString, IsNotEmpty, IsEmail, IsInt, Min, Max } from 'class-validator';

export class CreateFeedbackDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsNotEmpty()
  feedback: string;
}
