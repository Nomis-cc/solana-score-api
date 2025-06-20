import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AttestationService } from '../services/attestation.service';
import { CreateAttestationDto } from '../dtos/attestation.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller({
  path: 'attestation',
})
@ApiBearerAuth()
export class AttestationController {
  constructor(private readonly attestationService: AttestationService) {}

  @Get('credential')
  getCredential() {
    return this.attestationService.getCredential();
  }

  @Get('schema')
  getSchema() {
    return this.attestationService.getSchema();
  }

  @Get(':address')
  getAttestation(@Param('address') address: string) {
    return this.attestationService.getAttestation(address);
  }

  @Post('credential')
  createCredential() {
    return this.attestationService.createCredential();
  }

  @Post('schema')
  createSchema() {
    return this.attestationService.createSchema();
  }

  @Post('sign')
  sign(@Body() body: CreateAttestationDto) {
    return this.attestationService.createAttestation(body);
  }
}
