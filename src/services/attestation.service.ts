import { BadRequestException, Injectable } from '@nestjs/common';
import { UmiService } from './umi.service';
import { ConfigService } from '@nestjs/config';
import { fetchAttestation, fetchCredential, fetchSchema } from 'sas-lib';
import { createKeyPairSignerFromBytes, createSolanaRpc } from '@solana/kit';

import { CreateAttestationDto } from '../dtos/attestation.dto';
import { SasService } from './sas.service';

@Injectable()
export class AttestationService {
  private readonly adminPrivateKey: string;

  constructor(
    private configService: ConfigService,
    private umiService: UmiService,
    private sasService: SasService,
  ) {
    this.adminPrivateKey = this.configService.get<string>('ADMIN_PRIVATE_KEY');
  }

  async createCredential() {
    try {
      const umi = this.umiService.getUmi(this.adminPrivateKey);
      const admin = await this.getAdminSigner();
      const credential = await this.sasService.getCredentialPda(admin.address);

      const tx = await this.sasService
        .getCreateCredentialTransaction({
          authority: admin,
          credential,
          payer: admin,
          signers: [admin.address],
        })
        .sendAndConfirm(umi);

      return {
        transactionHash: tx.signature,
      };
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

      const tx = await this.sasService
        .getCreateSchemaTransaction({
          payer: admin,
          authority: admin,
          credential,
          schema,
        })
        .sendAndConfirm(umi);

      return {
        transactionHash: tx.signature,
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

      const credential = await this.sasService.getCredentialPda(admin.address);
      const schema = await this.sasService.getSchemaPda(credential);

      const attestation = await this.sasService.getAttestationPda(
        credential,
        schema,
        payer,
      );

      const data = [score];
      const expiry = 1750428253000;

      const tx = await this.sasService
        .getCreateAttestationTransaction({
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
      return { address: attestation.address };
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
