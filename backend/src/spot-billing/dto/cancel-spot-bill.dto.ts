import { IsString } from 'class-validator';

export class CancelSpotBillDto {
  @IsString()
  reason: string;
}
