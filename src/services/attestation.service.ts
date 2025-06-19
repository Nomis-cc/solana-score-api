import { BadRequestException, Injectable } from '@nestjs/common';
import { UmiService } from './umi.service';
import { ConfigService } from '@nestjs/config';

import {
  CreateCredentialInstruction,
  deriveCredentialPda,
  getCreateCredentialInstruction,
  fetchCredential,
} from 'sas-lib';
import {
  createKeyPairSignerFromBytes,
  Address,
  createSolanaRpc,
} from '@solana/kit';
import bs58 from 'bs58';
import {
  publicKey,
  transactionBuilder,
  TransactionBuilderItemsInput,
} from '@metaplex-foundation/umi';
import { SignDto } from '../dtos/attestation.dto';

const NAME = 'Nomis Attestation';

@Injectable()
export class AttestationService {
  private readonly adminPrivateKey: string;

  constructor(
    private configService: ConfigService,
    private umiService: UmiService,
  ) {
    this.adminPrivateKey = this.configService.get<string>('ADMIN_PRIVATE_KEY');
  }

  async createSchema() {
    const credential = await this.createCredential();

    // const transaction = getCreateSchemaInstruction({
    //   payer: payerSigner,
    //   authority: authoritySigner,
    //   credential: credentialPublicKey,
    //   schema: schemaPublicKey,
    //   systemProgram: systemProgramPublicKey,
    //   name: "Identity Verification",
    //   description: "Schema for verifying user identity information",
    //   layout: schemaLayoutBytes,
    //   fieldNames: ["fullName", "dateOfBirth", "nationality"]
    // });

    return {
      result: true,
      credential,
    };
  }

  async sign(body: SignDto) {
    // const tx = getCreateAttestationInstruction({
    //   payer: payerSigner,
    //   authority: authoritySigner,
    //   credential: credentialPublicKey,
    //   schema: schemaPublicKey,
    //   attestation: attestationPublicKey,
    //   systemProgram: systemProgramPublicKey,
    //   nonce: noncePublicKey,
    //   data: attestationData,
    //   expiry: expiryTimestamp,
    // });

    console.log(body);

    const umi = this.umiService.getUmi(this.adminPrivateKey);

    const tx = await transactionBuilder()
      // .add()
      .useV0()
      // .setFeePayer(createNoopSigner(userPublicKey))
      .setBlockhash(await umi.rpc.getLatestBlockhash())
      .buildAndSign(umi);

    const transaction = this.umiService.getBase64EncodedTransaction(tx);

    return {
      transaction,
    };
  }

  async test() {
    try {
      const rpc = createSolanaRpc(this.configService.get<string>('RPC'));

      const admin = await createKeyPairSignerFromBytes(
        Uint8Array.from(JSON.parse(this.adminPrivateKey) as number[]),
      );

      const [credentialPda] = await deriveCredentialPda({
        authority: bs58.decode(admin.address) as unknown as Address,
        name: NAME,
      });

      const credential = await fetchCredential(rpc, credentialPda);
      console.log('Credential', credentialPda, credential);
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error);
    }
  }

  async createCredential() {
    try {
      const umi = this.umiService.getUmi(this.adminPrivateKey);

      const admin = await createKeyPairSignerFromBytes(
        Uint8Array.from(JSON.parse(this.adminPrivateKey) as number[]),
      );

      const [credential] = await deriveCredentialPda({
        authority: bs58.decode(admin.address) as unknown as Address,
        name: NAME,
      });

      const ix = getCreateCredentialInstruction({
        authority: admin,
        credential,
        name: NAME,
        payer: admin,
        signers: [admin.address],
      });

      const tx = await transactionBuilder()
        .add(this.transformInstructionObject(ix as CreateCredentialInstruction))
        .sendAndConfirm(umi);

      console.log(tx);

      // .buildAndSign(umi);
      //
      // console.log(this.umiService.getBase64EncodedTransaction(tx));
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error);
    }
  }

  private transformInstructionObject(
    obj: CreateCredentialInstruction<
      Address<'22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG'>,
      string,
      string,
      string,
      string,
      []
    >,
  ): TransactionBuilderItemsInput {
    const keys = obj.accounts.map((acc) => {
      const pubkey = publicKey(acc.address);

      let isSigner = false;
      let isWritable = false;

      switch (Number(acc.role)) {
        case 0:
          isSigner = false;
          isWritable = false;
          break;
        case 1:
          isSigner = false;
          isWritable = true;
          break;
        case 2:
          isSigner = true;
          isWritable = false;
          break;
        case 3:
          isSigner = true;
          isWritable = true;
          break;
        default:
          throw new Error(`Unknown role: ${acc.role}`);
      }

      return {
        pubkey,
        isSigner,
        isWritable,
      };
    });

    return {
      instruction: {
        programId: publicKey(obj.programAddress),
        keys,
        data: Buffer.from(obj.data),
      },
      signers: [],
      bytesCreatedOnChain: 0,
    };
  }
}
