import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { CookieOptions } from 'express';
import type { ActorType } from '../auth.types';

const COOKIE_NAMES: Record<ActorType, string> = {
  user: 'zhixiangyun_user_refresh',
  admin: 'zhixiangyun_admin_refresh',
};

@Injectable()
export class AuthCookieService {
  private readonly secure: boolean;

  constructor(configService: ConfigService) {
    this.secure = configService.getOrThrow<string>('app.nodeEnv') === 'production';
  }

  setRefreshToken(response: Response, actorType: ActorType, token: string, expires: Date): void {
    response.cookie(COOKIE_NAMES[actorType], token, {
      ...this.options(actorType),
      expires,
    });
  }

  clearRefreshToken(response: Response, actorType: ActorType): void {
    response.clearCookie(COOKIE_NAMES[actorType], this.options(actorType));
  }

  getRefreshToken(request: Request, actorType: ActorType): string | null {
    const cookies = request.cookies as unknown;
    if (typeof cookies !== 'object' || cookies === null) return null;
    const value = (cookies as Record<string, unknown>)[COOKIE_NAMES[actorType]];
    return typeof value === 'string' && value ? value : null;
  }

  private options(actorType: ActorType): CookieOptions {
    return {
      httpOnly: true,
      secure: this.secure,
      sameSite: 'lax',
      path: `/api/v2/auth/${actorType}`,
    };
  }
}
