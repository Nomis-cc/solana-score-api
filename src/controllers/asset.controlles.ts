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
  get(@Query() query: AssetDto) {
    return this.assetService.get(query.address, query.collection);
  }

  @Post('sign')
  sign(@Body() body: SignDto) {
    return this.assetService.sign(body);
  }

  @Post('sign-by-user')
  signByUser(@Body() body: SignByUserDto) {
    return this.assetService.signByUser(body.transaction, body.privateKey);
  }
}
