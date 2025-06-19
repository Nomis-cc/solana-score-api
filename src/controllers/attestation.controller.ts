import { Body, Controller, Get, Post } from '@nestjs/common';
import { AttestationService } from '../services/attestation.service';
import { SignDto } from '../dtos/attestation.dto';

@Controller({
  path: 'attestation',
})
export class AttestationController {
  constructor(private readonly attestationService: AttestationService) {}

  @Post('schema')
  createSchema() {
    return this.attestationService.createSchema();
  }

  @Get('test')
  test() {
    return this.attestationService.test();
  }

  @Post('sign')
  sign(@Body() body: SignDto) {
    return this.attestationService.sign(body);
  }
}
