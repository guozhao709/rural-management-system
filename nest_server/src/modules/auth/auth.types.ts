import type { Request } from 'express';
import type { Admin } from '../admins/admin.entity';
import type { User } from '../users/user.entity';

export type ActorType = 'user' | 'admin';
export type TokenType = 'access' | 'refresh';

export interface JwtActorPayload {
  sub: number;
  actorType: ActorType;
  tokenType: TokenType;
  jti?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  currentUser?: User;
  currentAdmin?: Admin;
}

export interface IssuedTokenPair {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresAt: Date;
}
