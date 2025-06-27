import { BadRequestException, Injectable } from '@nestjs/common';
import { UmiService } from './umi.service';
import { ConfigService } from '@nestjs/config';
import {
  fetchAttestation,
  fetchCredential,
  fetchSchema,
  deserializeAttestationData,
  Schema,
} from 'sas-lib';
import {
  Account,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
} from '@solana/kit';

import { SasService } from './sas.service';
import { createNoopSigner, publicKey } from '@metaplex-foundation/umi';
import { AssetService } from './asset.service';
import { CreateAttestationDto } from '../dtos/attestation.dto';

let cachedSchema: Account<Schema>;

@Injectable()
export class AttestationService {
  private readonly adminPrivateKey: string;

  constructor(
    private configService: ConfigService,
    private umiService: UmiService,
    private sasService: SasService,
    private assetService: AssetService,
  ) {
    this.adminPrivateKey = this.configService.get<string>('ADMIN_PRIVATE_KEY');
  }

  async createCredential() {
    try {
      const umi = this.umiService.getUmi(this.adminPrivateKey);
      const admin = await this.getAdminSigner();
      const credential = await this.sasService.getCredentialPda(admin.address);

      await this.sasService
        .getCreateCredentialTransaction({
          authority: admin,
          credential,
          payer: admin,
          signers: [admin.address],
        })
        .sendAndConfirm(umi);

      return { address: credential };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  async createSchema() {
    try {
      const umi = this.umiService.getUmi(this.adminPrivateKey);
      const admin = await this.getAdminSigner();
      const credential = await this.sasService.getCredentialPda(admin.address);
      const schema = await this.sasService.getSchemaPda(credential);

      await this.sasService
        .getCreateSchemaTransaction({
          payer: admin,
          authority: admin,
          credential,
          schema,
        })
        .sendAndConfirm(umi);

      return {
        address: schema,
      };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  async createAttestation(body: CreateAttestationDto) {
    try {
      const { collection: collectionPublicKey, address: userPublicKey } = body;

      const asset = await this.assetService.get(
        userPublicKey,
        collectionPublicKey,
      );

      const score =
        +asset.attributes.attributeList.find((i) => i.key === 'score')?.value ||
        0;

      const umi = this.umiService.getUmi(this.adminPrivateKey);

      const admin = await this.getAdminSigner();

      const credential = await this.sasService.getCredentialPda(admin.address);
      const schema = await this.sasService.getSchemaPda(credential);

      const attestation = await this.sasService.getAttestationPda(
        credential,
        schema,
        userPublicKey,
      );

      const payerNoopSigner = createNoopSigner(publicKey(userPublicKey));

      const tx = await this.sasService
        .getCreateAttestationTransaction({
          payer: userPublicKey,
          authority: admin,
          credential,
          schema,
          attestation,
          nonce: userPublicKey,
          data: [score],
          expiry: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
          signers: [umi.payer, payerNoopSigner],
        })
        .useV0()
        .setFeePayer(payerNoopSigner)
        .setBlockhash(await umi.rpc.getLatestBlockhash())
        .buildAndSign(umi);

      return {
        transaction: this.umiService.getBase64EncodedTransaction(tx),
      };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  async getCredential() {
    try {
      const rpc = createSolanaRpc(this.configService.get<string>('RPC'));
      const admin = await this.getAdminSigner();
      const credentialPda = await this.sasService.getCredentialPda(
        admin.address,
      );
      const credential = await fetchCredential(rpc, credentialPda);
      return { address: credential.address };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  async getSchema() {
    try {
      const rpc = createSolanaRpc(this.configService.get<string>('RPC'));
      const admin = await this.getAdminSigner();
      const credentialPda = await this.sasService.getCredentialPda(
        admin.address,
      );
      const schemaPda = await this.sasService.getSchemaPda(credentialPda);
      const schema = await fetchSchema(rpc, schemaPda);
      return { address: schema.address };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  async getAttestation(address: string) {
    try {
      const rpc = createSolanaRpc(this.configService.get<string>('RPC'));
      const admin = await this.getAdminSigner();

      const credentialPda = await this.sasService.getCredentialPda(
        admin.address,
      );
      const schemaPda = await this.sasService.getSchemaPda(credentialPda);
      const attestationPda = await this.sasService.getAttestationPda(
        credentialPda,
        schemaPda,
        address,
      );

      const attestation = await fetchAttestation(rpc, attestationPda);

      if (!cachedSchema) {
        cachedSchema = await fetchSchema(rpc, schemaPda);
      }

      const data: { score: number } = deserializeAttestationData(
        cachedSchema.data,
        attestation.data.data as Uint8Array<ArrayBufferLike>,
      );

      const yearSeconds = 365 * 24 * 60 * 60;

      let expiry = Number(attestation.data.expiry);

      if (expiry > 9999999999) {
        expiry = Math.floor(expiry / 1000);
      }

      return {
        address: attestation.address,
        score: data.score,
        expiresAt: expiry,
        createdAt: expiry - yearSeconds,
      };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  private async getAdminSigner() {
    return await createKeyPairSignerFromBytes(
      Uint8Array.from(JSON.parse(this.adminPrivateKey) as number[]),
    );
  }
}
