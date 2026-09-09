import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyPaymentDto {
  @IsInt()
  @IsNotEmpty()
  orderId: number;

  @IsString()
  @IsNotEmpty()
  gatewayCode: string;

  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @IsOptional()
  @IsString()
  paymentSignature?: string;

  @IsOptional()
  @IsString()
  gatewayData?: string;
}
