import { BadRequestException, Injectable } from '@nestjs/common';
import {
  createNoopSigner,
  generateSigner,
  lamports,
  publicKey,
  transactionBuilder,
  TransactionBuilder,
} from '@metaplex-foundation/umi';
import {
  addPlugin,
  create,
  fetchAssetsByOwner,
  fetchCollection,
  update,
  updatePlugin,
  UpdatePluginArgsPlugin,
} from '@metaplex-foundation/mpl-core';
import { transferSol } from '@metaplex-foundation/mpl-toolbox';
import { base64, base58 } from '@metaplex-foundation/umi/serializers';
import { ConfigService } from '@nestjs/config';
import { UmiService } from './umi.service';
import { SignDto } from '../dtos/asset.dto';

@Injectable()
export class AssetService {
  private readonly adminPrivateKey: string;

  constructor(
    private configService: ConfigService,
    private umiService: UmiService,
  ) {
    this.adminPrivateKey = this.configService.get<string>('ADMIN_PRIVATE_KEY');
  }

  private async getAsset(userPublicKey: string, collectionPublicKey: string) {
    try {
      const umi = this.umiService.getUmi();

      const assets = await fetchAssetsByOwner(umi, publicKey(userPublicKey), {
        skipDerivePlugins: false,
      });

      return assets.find(
        ({ updateAuthority: { address } }) => address === collectionPublicKey,
      );
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  async sign(body: SignDto) {
    const {
      collection: collectionPublicKey,
      address,
      name,
      metadataUrl,
      score,
      createAmount,
      updateAmount,
    } = body;

    try {
      const userPublicKey = publicKey(address);
      const umi = this.umiService.getUmi(this.adminPrivateKey);
      const collection = await fetchCollection(umi, collectionPublicKey);
      const asset = await this.getAsset(userPublicKey, collectionPublicKey);

      const txs: TransactionBuilder[] = [];

      const sbtData = {
        collection,
        authority: umi.identity,
        payer: createNoopSigner(userPublicKey),
        name,
        uri: metadataUrl,
      };

      const plugin: UpdatePluginArgsPlugin = {
        type: 'Attributes',
        attributeList: [{ key: 'score', value: score.toString() }],
      };

      if (asset) {
        txs.push(
          update(umi, {
            ...sbtData,
            asset,
          }),
          updatePlugin(umi, {
            asset: publicKey(asset),
            collection: publicKey(collectionPublicKey),
            plugin,
          }),
        );
      } else {
        const assetSigner = generateSigner(umi);
        txs.push(
          create(umi, {
            ...sbtData,
            asset: assetSigner,
            owner: userPublicKey,
          }),
          addPlugin(umi, {
            asset: publicKey(assetSigner),
            collection: publicKey(collectionPublicKey),
            plugin,
          }),
        );
      }

      txs.push(
        transferSol(umi, {
          source: createNoopSigner(userPublicKey),
          destination: publicKey(umi.identity),
          amount: lamports(asset ? updateAmount : createAmount),
        }),
      );

      const tx = await transactionBuilder()
        .add(txs)
        .useV0()
        .setBlockhash(await umi.rpc.getLatestBlockhash())
        .buildAndSign(umi);

      return base64.deserialize(umi.transactions.serialize(tx))[0];
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  async signByUser(serializedTx: string, userPrivateKey: string) {
    try {
      const umi = this.umiService.getUmi(userPrivateKey);

      const tx = await umi.rpc.sendTransaction(
        await umi.identity.signTransaction(
          umi.transactions.deserialize(base64.serialize(serializedTx)),
        ),
      );

      return base58.deserialize(tx)[0];
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  async get(userPublicKey: string, collectionPublicKey: string) {
    try {
      const asset = await this.getAsset(userPublicKey, collectionPublicKey);
      if (!asset) throw new Error('Not found');
      return asset;
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }
}
