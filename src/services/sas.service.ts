import { Injectable } from '@nestjs/common';
import { PublicKey } from '@solana/web3.js';
import { address, Address, createNoopSigner } from '@solana/kit';

import {
  publicKey,
  transactionBuilder,
  TransactionBuilderItemsInput,
  // Signer,
  // createNoopSigner as umiCreateNoopSigner,
} from '@metaplex-foundation/umi';

import {
  CreateSchemaInput,
  CreateCredentialInput,
  CreateAttestationInput,
  CreateSchemaInstruction,
  CreateCredentialInstruction,
  CreateAttestationInstruction,
  deriveSchemaPda,
  deriveCredentialPda,
  deriveAttestationPda,
  getCreateSchemaInstruction,
  getCreateCredentialInstruction,
  getCreateAttestationInstruction,
} from 'sas-lib';

const CREDENTIAL_NAME = 'Nomis Attestation';
const SCHEMA_NAME = CREDENTIAL_NAME;
const SCHEMA_DESCRIPTION = 'Schema for verifying user identity information';
const SCHEMA_LAYOUT = new Uint8Array([1]);
const SCHEMA_FIELD_NAMES = ['score'];

@Injectable()
export class SasService {
  async getCredentialPda(address: string) {
    const [pda] = await deriveCredentialPda({
      authority: new PublicKey(address).toBytes() as unknown as Address,
      name: CREDENTIAL_NAME,
    });
    return pda;
  }

  async getSchemaPda(address: string) {
    const [pda] = await deriveSchemaPda({
      credential: new PublicKey(address).toBytes() as unknown as Address,
      name: SCHEMA_NAME,
      version: 1,
    });
    return pda;
  }

  async getAttestationPda(credential: string, schema: string, nonce: string) {
    const [pda] = await deriveAttestationPda({
      credential: new PublicKey(credential).toBytes() as unknown as Address,
      schema: new PublicKey(schema).toBytes() as unknown as Address,
      nonce: new PublicKey(nonce).toBytes() as unknown as Address,
    });
    return pda;
  }

  getCreateCredentialTransaction(props: Omit<CreateCredentialInput, 'name'>) {
    const ix = this.transformInstructionObject(
      getCreateCredentialInstruction({
        ...props,
        name: CREDENTIAL_NAME,
      }),
    );
    return transactionBuilder().add(ix);
  }

  getCreateSchemaTransaction(
    props: Omit<
      CreateSchemaInput,
      'name' | 'description' | 'layout' | 'fieldNames'
    >,
  ) {
    const ix = this.transformInstructionObject(
      getCreateSchemaInstruction({
        ...props,
        name: SCHEMA_NAME,
        description: SCHEMA_DESCRIPTION,
        layout: SCHEMA_LAYOUT,
        fieldNames: SCHEMA_FIELD_NAMES,
      }),
    );
    return transactionBuilder().add(ix);
  }

  getCreateAttestationTransaction(
    props: Omit<CreateAttestationInput, 'payer' | 'nonce' | 'data'> & {
      payer: string;
      nonce: string;
      data: number[];
    },
  ) {
    const nonce = address(props.payer);
    const payer = createNoopSigner(nonce);
    const data = new Uint8Array(new Uint16Array(props.data).buffer);

    const ix = getCreateAttestationInstruction({
      ...props,
      nonce,
      payer,
      data,
    });

    // console.dir(ix, { depth: null, colors: true });

    return transactionBuilder().add(this.transformInstructionObject(ix));
  }

  transformInstructionObject(
    obj:
      | CreateCredentialInstruction<Address, string, string, string, string, []>
      | CreateSchemaInstruction<
          Address,
          string,
          string,
          string,
          string,
          string,
          []
        >
      | CreateAttestationInstruction<
          Address,
          string,
          string,
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

    // const signers: Signer[] = (obj.accounts as unknown as { signer?: Signer }[])
    //   .filter((acc) => acc.signer)
    //   .map((acc) => umiCreateNoopSigner(acc.signer.publicKey));

    return {
      instruction: {
        programId: publicKey(obj.programAddress),
        keys,
        data: Buffer.from(obj.data),
      },
      signers: [],
      // signers,
      bytesCreatedOnChain: 0,
    };
  }
}
