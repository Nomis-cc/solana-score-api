import { IsNotEmpty, IsOptional } from 'class-validator';

export class CollectionDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  metadataUrl: string;

  @IsOptional()
  address?: string;
}
