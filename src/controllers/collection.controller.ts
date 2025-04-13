import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CollectionService } from '../services/collection.service';
import { CollectionDto } from '../dtos/collection.dto';

@Controller({
  path: 'collection',
})
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Get(':address')
  async get(@Param('address') address: string) {
    const collection = await this.collectionService.get(address);
    return { data: collection };
  }

  @Post('')
  async create(@Body() body: CollectionDto) {
    const collection = await this.collectionService.upsert(null, body);
    return { data: collection };
  }

  @Post(':address')
  async update(@Param('address') address: string, @Body() body: CollectionDto) {
    const collection = await this.collectionService.upsert(address, body);
    return { data: collection };
  }
}
