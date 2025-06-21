import { Injectable } from '@nestjs/common';
import { PublicKey } from '@solana/web3.js';

import { address, Address, createNoopSigner } from '@solana/kit';

import {
  publicKey,
  Signer,
  TransactionBuilder,
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
    return this.transformUmiIx(
      getCreateCredentialInstruction({
        ...props,
        name: CREDENTIAL_NAME,
      }),
    );
  }

  getCreateSchemaTransaction(
    props: Omit<
      CreateSchemaInput,
      'name' | 'description' | 'layout' | 'fieldNames'
    >,
  ) {
    return this.transformUmiIx(
      getCreateSchemaInstruction({
        ...props,
        name: SCHEMA_NAME,
        description: SCHEMA_DESCRIPTION,
        layout: SCHEMA_LAYOUT,
        fieldNames: SCHEMA_FIELD_NAMES,
      }),
    );
  }

  getCreateAttestationTransaction(
    props: Omit<CreateAttestationInput, 'payer' | 'nonce' | 'data'> & {
      payer: string;
      nonce: string;
      data: number[];
      signers: Signer[];
    },
  ) {
    const nonce = address(props.payer);
    const payer = createNoopSigner(nonce);
    const data = new Uint8Array(new Uint16Array(props.data).buffer);
    const { signers } = props;

    return this.transformUmiIx(
      getCreateAttestationInstruction({
        ...props,
        nonce,
        payer,
        data,
      }),
      signers,
    );
  }

  transformUmiIx(
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
    signers: Signer[] = [],
  ): TransactionBuilder {
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

    return new TransactionBuilder().add({
      instruction: {
        programId: publicKey(obj.programAddress),
        keys,
        data: Buffer.from(obj.data),
      },
      signers,
      bytesCreatedOnChain: 0,
    });
  }
}
