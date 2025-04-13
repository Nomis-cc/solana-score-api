import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { UmiService } from './services/umi.service';
import { CollectionController } from './controllers/collection.controller';
import { AssetController } from './controllers/asset.controlles';
import { CollectionService } from './services/collection.service';
import { AssetService } from './services/asset.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        AUTH_SECRET_KEY: Joi.string().required(),
        ADMIN_PRIVATE_KEY: Joi.string().required(),
        NETWORK: Joi.string()
          .valid('mainnet-beta', 'devnet', 'testnet')
          .empty('')
          .default('mainnet-beta'),
      }),
    }),
  ],
  controllers: [CollectionController, AssetController],
  providers: [CollectionService, AssetService, UmiService],
})
export class AppModule {}
