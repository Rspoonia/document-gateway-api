import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { sign } from 'jsonwebtoken';

@Injectable()
export class JwtService {
  constructor(private readonly configService: ConfigService) {}

  sign(payload: object | string | Buffer): string {
    const secret = this.configService.get('jwt.secret');
    const expiresIn = this.configService.get('jwt.expiry');

    if (typeof payload === 'string') {
      return sign({ data: payload }, secret, { expiresIn });
    }
    
    return sign(payload, secret, { expiresIn });
  }
}