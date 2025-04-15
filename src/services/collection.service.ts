import { BadRequestException, Injectable } from '@nestjs/common';
import { generateSigner, publicKey } from '@metaplex-foundation/umi';
import {
  createCollection,
  fetchCollection,
  updateCollection,
} from '@metaplex-foundation/mpl-core';
import { ConfigService } from '@nestjs/config';
import { UmiService } from './umi.service';
import { CollectionDto } from '../dtos/collection.dto';

@Injectable()
export class CollectionService {
  private readonly adminPrivateKey: string;

  constructor(
    private configService: ConfigService,
    private umiService: UmiService,
  ) {
    this.adminPrivateKey = this.configService.get<string>('ADMIN_PRIVATE_KEY');
  }

  async get(address: string) {
    try {
      const umi = this.umiService.getUmi(this.adminPrivateKey);
      return await fetchCollection(umi, publicKey(address));
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  async upsert(address: string, body: CollectionDto) {
    const { name, metadataUrl: uri } = body;

    try {
      const umi = this.umiService.getUmi(this.adminPrivateKey);
      const signer = generateSigner(umi);
      const collectionPublicKey = address
        ? publicKey(address)
        : signer.publicKey;

      const tx = address
        ? updateCollection(umi, { name, uri, collection: collectionPublicKey })
        : createCollection(umi, { name, uri, collection: signer });

      await tx.sendAndConfirm(umi);

      return await fetchCollection(umi, collectionPublicKey);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }
}
