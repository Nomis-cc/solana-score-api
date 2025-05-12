import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class AssetDto {
  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  collection: string;
}

export class SignDto {
  @IsNotEmpty()
  collection: string;

  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  @IsUrl()
  metadataUrl: string;

  @IsNotEmpty()
  @Min(0)
  @Max(10000)
  score: number;

  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  referrer: string;

  @IsNotEmpty()
  @Transform(({ value }) => BigInt(value as string))
  createAmount: bigint;

  @IsNotEmpty()
  @Transform(({ value }) => BigInt(value as string))
  updateAmount: bigint;

  @IsOptional()
  @Transform(({ value }) => BigInt(value as string))
  refAmount: bigint;
}

export class SignByUserDto {
  @IsNotEmpty()
  transaction: string;

  @IsNotEmpty()
  privateKey: string;
}
