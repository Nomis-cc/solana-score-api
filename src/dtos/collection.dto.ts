import { IsNotEmpty } from 'class-validator';

export class CollectionDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  metadataUrl: string;
}
