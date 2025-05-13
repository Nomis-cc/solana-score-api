import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AssetService } from '../services/asset.service';
import { AssetDto, SignByUserDto, SignDto } from '../dtos/asset.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller({
  path: 'asset',
})
@ApiBearerAuth()
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Get()
  async get(@Query() query: AssetDto) {
    const asset = await this.assetService.get(query.address, query.collection);
    return { data: asset };
  }

  @Post('sign')
  async sign(@Body() body: SignDto) {
    const result = await this.assetService.sign(body);
    return { data: result };
  }

  @Post('sign-by-user')
  async signByUser(@Body() body: SignByUserDto) {
    const transactionHash = await this.assetService.signByUser(
      body.transaction,
      body.privateKey,
    );
    return { data: transactionHash };
  }
}
