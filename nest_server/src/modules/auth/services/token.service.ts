import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';
import type { ActorType, IssuedTokenPair, JwtActorPayload } from '../auth.types';

const TTL_MULTIPLIERS = { s: 1, m: 60, h: 3600, d: 86400 } as const;

@Injectable()
export class TokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessTtl: string;
  private readonly refreshTtl: string;
  private readonly accessExpiresIn: number;
  private readonly refreshExpiresIn: number;

  constructor(
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.accessSecret = configService.getOrThrow<string>('auth.accessSecret');
    this.refreshSecret = configService.getOrThrow<string>('auth.refreshSecret');
    this.accessTtl = configService.getOrThrow<string>('auth.accessTtl');
    this.refreshTtl = configService.getOrThrow<string>('auth.refreshTtl');
    this.accessExpiresIn = this.parseTtl(this.accessTtl);
    this.refreshExpiresIn = this.parseTtl(this.refreshTtl);
  }

  async issuePair(sub: number, actorType: ActorType): Promise<IssuedTokenPair> {
    const accessPayload: JwtActorPayload = { sub, actorType, tokenType: 'access' };
    const refreshPayload: JwtActorPayload = {
      sub,
      actorType,
      tokenType: 'refresh',
      jti: randomUUID(),
    };
    const baseOptions: Pick<JwtSignOptions, 'algorithm'> = { algorithm: 'HS256' };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        ...baseOptions,
        secret: this.accessSecret,
        expiresIn: this.accessTtl as JwtSignOptions['expiresIn'],
      }),
      this.jwtService.signAsync(refreshPayload, {
        ...baseOptions,
        secret: this.refreshSecret,
        expiresIn: this.refreshTtl as JwtSignOptions['expiresIn'],
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      accessExpiresIn: this.accessExpiresIn,
      refreshExpiresAt: new Date(Date.now() + this.refreshExpiresIn * 1000),
    };
  }

  verifyAccess(token: string, actorType: ActorType): Promise<JwtActorPayload> {
    return this.verify(token, this.accessSecret, actorType, 'access');
  }

  verifyRefresh(token: string, actorType: ActorType): Promise<JwtActorPayload> {
    return this.verify(token, this.refreshSecret, actorType, 'refresh');
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  matchesRefreshToken(token: string, expectedHash: string): boolean {
    const actual = Buffer.from(this.hashRefreshToken(token), 'hex');
    const expected = Buffer.from(expectedHash, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  private async verify(
    token: string,
    secret: string,
    actorType: ActorType,
    tokenType: 'access' | 'refresh',
  ): Promise<JwtActorPayload> {
    try {
      const options: JwtVerifyOptions = { secret, algorithms: ['HS256'] };
      const payload = await this.jwtService.verifyAsync<JwtActorPayload>(token, options);
      if (
        !Number.isInteger(payload.sub) ||
        payload.sub <= 0 ||
        payload.actorType !== actorType ||
        payload.tokenType !== tokenType
      ) {
        throw new UnauthorizedException('认证凭证无效');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('认证凭证无效');
    }
  }

  private parseTtl(value: string): number {
    const match = /^(\d+)([smhd])$/.exec(value);
    if (!match?.[1] || !match[2]) throw new Error(`Invalid JWT TTL: ${value}`);
    return Number(match[1]) * TTL_MULTIPLIERS[match[2] as keyof typeof TTL_MULTIPLIERS];
  }
}
