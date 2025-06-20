import { BadRequestException, Injectable } from '@nestjs/common';
import { UmiService } from './umi.service';
import { ConfigService } from '@nestjs/config';
import { fetchCredential, fetchSchema } from 'sas-lib';
import { createKeyPairSignerFromBytes, createSolanaRpc } from '@solana/kit';

import {
  getSchemaPda,
  getCredentialPda,
  getAttestationPda,
  getCreateSchemaTransaction,
  getCreateCredentialTransaction,
  getCreateAttestationTransaction,
} from '../tools/attestation';
import { CreateAttestationDto } from '../dtos/attestation.dto';

@Injectable()
export class AttestationService {
  private readonly adminPrivateKey: string;

  constructor(
    private configService: ConfigService,
    private umiService: UmiService,
  ) {
    this.adminPrivateKey = this.configService.get<string>('ADMIN_PRIVATE_KEY');
  }

  async createCredential() {
    try {
      const umi = this.umiService.getUmi(this.adminPrivateKey);

      const admin = await this.getAdminSigner();

      const credential = await getCredentialPda(admin.address);

      const createCredentialTx = await getCreateCredentialTransaction({
        authority: admin,
        credential,
        payer: admin,
        signers: [admin.address],
      }).buildAndSign(umi);
      // .sendAndConfirm(umi);

      return {
        result: true,
        tx: this.umiService.getBase64EncodedTransaction(createCredentialTx),
      };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  async createSchema() {
    try {
      const umi = this.umiService.getUmi(this.adminPrivateKey);

      const admin = await this.getAdminSigner();

      const credential = await getCredentialPda(admin.address);
      const schema = await getSchemaPda(credential);

      const createSchemaTx = await getCreateSchemaTransaction({
        payer: admin,
        authority: admin,
        credential,
        schema,
      }).buildAndSign(umi);
      // .sendAndConfirm(umi);

      return {
        result: true,
        tx: this.umiService.getBase64EncodedTransaction(createSchemaTx),
      };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  async createAttestation(props: CreateAttestationDto) {
    try {
      const { address: payer, score } = props;

      const umi = this.umiService.getUmi(this.adminPrivateKey);

      const admin = await this.getAdminSigner();

      const credential = await getCredentialPda(admin.address);
      const schema = await getSchemaPda(credential);

      const attestation = await getAttestationPda(credential, schema, payer);

      const data = [score];
      const expiry = 1750428253000;

      const tx = await getCreateAttestationTransaction({
        payer,
        authority: admin,
        credential,
        schema,
        attestation,
        nonce: payer,
        data,
        expiry,
      })
        .useV0()
        // .setFeePayer(createNoopSigner(publicKey(payer)))
        .setBlockhash(await umi.rpc.getLatestBlockhash())
        .buildAndSign(umi);

      return {
        transaction: this.umiService.getBase64EncodedTransaction(tx),
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException((error as Error).message);
    }
  }

  async getCredential() {
    try {
      const rpc = createSolanaRpc(this.configService.get<string>('RPC'));
      const admin = await this.getAdminSigner();
      const credentialPda = await getCredentialPda(admin.address);
      const credential = await fetchCredential(rpc, credentialPda);
      return credential.address;
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  async getSchema() {
    try {
      const rpc = createSolanaRpc(this.configService.get<string>('RPC'));
      const admin = await this.getAdminSigner();
      const credentialPda = await getCredentialPda(admin.address);
      const schemaPda = await getSchemaPda(credentialPda);
      const schema = await fetchSchema(rpc, schemaPda);
      return schema.address;
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
