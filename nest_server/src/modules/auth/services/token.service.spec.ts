import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from './token.service';

describe('TokenService', () => {
  const jwtService = new JwtService();
  const service = new TokenService(
    jwtService,
    new ConfigService({
      auth: {
        accessSecret: 'unit-access-secret-with-at-least-32-characters',
        refreshSecret: 'unit-refresh-secret-with-at-least-32-characters',
        accessTtl: '15m',
        refreshTtl: '30d',
      },
    }),
  );

  it('issues isolated HS256 access and refresh tokens with minimal identity claims', async () => {
    const tokens = await service.issuePair(12, 'user');
    const access = await service.verifyAccess(tokens.accessToken, 'user');
    const refresh = await service.verifyRefresh(tokens.refreshToken, 'user');

    expect(access).toMatchObject({ sub: 12, actorType: 'user', tokenType: 'access' });
    expect(refresh).toMatchObject({ sub: 12, actorType: 'user', tokenType: 'refresh' });
    expect(refresh.jti).toEqual(expect.any(String));
    expect(access).not.toHaveProperty('phone');
    expect(access).not.toHaveProperty('role');
    await expect(service.verifyAccess(tokens.refreshToken, 'user')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('separates user/admin actors and creates a 64-character SHA-256 hash', async () => {
    const tokens = await service.issuePair(1, 'admin');
    const hash = service.hashRefreshToken(tokens.refreshToken);

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(service.matchesRefreshToken(tokens.refreshToken, hash)).toBe(true);
    await expect(service.verifyAccess(tokens.accessToken, 'user')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects expired and wrong-algorithm tokens', async () => {
    const expired = await jwtService.signAsync(
      { sub: 1, actorType: 'user', tokenType: 'access' },
      {
        secret: 'unit-access-secret-with-at-least-32-characters',
        algorithm: 'HS256',
        expiresIn: -1,
      },
    );
    const wrongAlgorithm = await jwtService.signAsync(
      { sub: 1, actorType: 'user', tokenType: 'access' },
      {
        secret: 'unit-access-secret-with-at-least-32-characters',
        algorithm: 'HS384',
        expiresIn: '15m',
      },
    );

    await expect(service.verifyAccess(expired, 'user')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(service.verifyAccess(wrongAlgorithm, 'user')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
