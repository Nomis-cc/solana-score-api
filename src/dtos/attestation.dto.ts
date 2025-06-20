import { IsNotEmpty, Max, Min } from 'class-validator';

export class AddressDto {
  @IsNotEmpty()
  address: string;
}

export class CreateAttestationDto extends AddressDto {
  @IsNotEmpty()
  @Min(0)
  @Max(10000)
  score: number;
}
