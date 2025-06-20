import { IsNotEmpty, Max, Min } from 'class-validator';

export class CreateAttestationDto {
  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  @Min(0)
  @Max(10000)
  score: number;
}
