import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth.types';
import { AuthService } from '../auth.service';

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    request.currentUser = await this.authService.authenticateUserAccess(
      this.extractBearerToken(request),
    );
    return true;
  }

  private extractBearerToken(request: AuthenticatedRequest): string {
    const authorization = request.headers.authorization;
    const [scheme, token, extra] = authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token || extra) {
      throw new UnauthorizedException('需要有效的用户 Access Token');
    }
    return token;
  }
}
