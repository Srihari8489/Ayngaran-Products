import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AssignDeliveryDto {
  @IsOptional()
  @IsInt()
  deliveryPartnerId?: number;

  @IsOptional()
  @IsString()
  courierName?: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
