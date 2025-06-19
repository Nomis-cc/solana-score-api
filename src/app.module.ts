import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { UmiService } from './services/umi.service';
import { CollectionController } from './controllers/collection.controller';
import { AssetController } from './controllers/asset.controlles';
import { CollectionService } from './services/collection.service';
import { AssetService } from './services/asset.service';
import { AttestationController } from './controllers/attestation.controller';
import { AttestationService } from './services/attestation.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        AUTH_SECRET_KEY: Joi.string().required(),
        ADMIN_PRIVATE_KEY: Joi.string().required(),
        MERCHANT_PUBLIC_KEY: Joi.string().required(),
        RPC: Joi.string().required(),
      }),
    }),
  ],
  controllers: [CollectionController, AssetController, AttestationController],
  providers: [CollectionService, AssetService, AttestationService, UmiService],
})
export class AppModule {}
