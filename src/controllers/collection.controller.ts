import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CollectionService } from '../services/collection.service';
import { CollectionDto } from '../dtos/collection.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller({
  path: 'collection',
})
@ApiBearerAuth()
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Get(':address')
  get(@Param('address') address: string) {
    return this.collectionService.get(address);
  }

  @Post('')
  create(@Body() body: CollectionDto) {
    return this.collectionService.upsert(null, body);
  }

  @Post(':address')
  update(@Param('address') address: string, @Body() body: CollectionDto) {
    return this.collectionService.upsert(address, body);
  }
}
