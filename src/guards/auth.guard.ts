import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authKey = request.headers['authorization'];

    if (!authKey) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const token = authKey.split(' ')[1];
    const secretKey = this.configService.get<string>('AUTH_SECRET_KEY');

    if (token !== secretKey) {
      throw new UnauthorizedException('Invalid token');
    }

    return true;
  }
}
