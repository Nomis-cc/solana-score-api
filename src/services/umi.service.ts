import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Umi } from '@metaplex-foundation/umi';
import {
  createSignerFromKeypair,
  signerIdentity,
} from '@metaplex-foundation/umi';
import { Cluster, clusterApiUrl } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';

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
}
