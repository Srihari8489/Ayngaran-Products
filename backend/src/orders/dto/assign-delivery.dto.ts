import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AssignDeliveryDto {
  @IsInt()
  @IsNotEmpty()
  deliveryPartnerId: number;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
