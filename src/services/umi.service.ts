import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transaction, Umi } from '@metaplex-foundation/umi';
import {
  createSignerFromKeypair,
  signerIdentity,
} from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { base64 } from '@metaplex-foundation/umi/serializers';

@Injectable()
export class UmiService {
  constructor(private configService: ConfigService) {}

  getUmi(privateKey?: string): Umi {
    const rpc = this.configService.get<string>('RPC');
    const umi = createUmi(rpc);

    if (privateKey) {
      const keypair = umi.eddsa.createKeypairFromSecretKey(
        Uint8Array.from(JSON.parse(privateKey) as number[]),
      );

      const signer = createSignerFromKeypair(umi, keypair);

      umi.use(signerIdentity(signer));
    }

    return umi;
  }

  getBase64EncodedTransaction(tx: Transaction) {
    const umi = this.getUmi();
    return base64.deserialize(umi.transactions.serialize(tx))[0];
  }
}
