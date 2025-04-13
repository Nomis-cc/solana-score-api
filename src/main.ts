import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AuthGuard } from './guards/auth.guard';
import { ConfigService } from '@nestjs/config';
import * as packageJson from '../package.json';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
BigInt.prototype.toJSON = function () {
  return String(this);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.setGlobalPrefix('api');

  const { name } = packageJson as { name: string };
  const config = new DocumentBuilder().setTitle(name).addBearerAuth().build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.useGlobalGuards(new AuthGuard(app.get(ConfigService)));

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
