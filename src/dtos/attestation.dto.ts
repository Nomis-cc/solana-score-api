import { IsNotEmpty } from 'class-validator';

export class CreateAttestationDto {
  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  collection: string;
}
