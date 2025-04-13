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

  private getKeypairSigner(umi: Umi, privateKeyHex: string) {
    const privateKey = Uint8Array.from(Buffer.from(privateKeyHex, 'hex'));
    const keypair = umi.eddsa.createKeypairFromSecretKey(privateKey);
    return createSignerFromKeypair(umi, keypair);
  }

  getUmi(privateKeyHex?: string): Umi {
    const network = this.configService.get<string>('NETWORK') as Cluster;
    const umi = createUmi(clusterApiUrl(network));

    if (privateKeyHex) {
      const signer = this.getKeypairSigner(umi, privateKeyHex);
      umi.use(signerIdentity(signer));
    }

    return umi;
  }
}
