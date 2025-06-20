import { Body, Controller, Get, Post } from '@nestjs/common';
import { AttestationService } from '../services/attestation.service';
import { CreateAttestationDto } from '../dtos/attestation.dto';

@Controller({
  path: 'attestation',
})
export class AttestationController {
  constructor(private readonly attestationService: AttestationService) {}

  @Get('credential')
  async getCredential() {
    const credential = await this.attestationService.getCredential();
    return { data: { credential } };
  }

  @Post('credential')
  async createCredential() {
    const credential = await this.attestationService.createCredential();
    return { data: { credential } };
  }

  @Get('schema')
  async getSchema() {
    const schema = await this.attestationService.getSchema();
    return { data: { schema } };
  }

  @Post('schema')
  async createSchema() {
    const schema = await this.attestationService.createSchema();
    return { data: { schema } };
  }

  @Post('sign')
  async sign(@Body() body: CreateAttestationDto) {
    const transaction = await this.attestationService.createAttestation(body);
    return { data: transaction };
  }
}
