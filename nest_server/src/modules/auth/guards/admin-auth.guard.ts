import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth.types';
import { AuthService } from '../auth.service';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    request.currentAdmin = await this.authService.authenticateAdminAccess(
      this.extractBearerToken(request),
    );
    return true;
  }

  private extractBearerToken(request: AuthenticatedRequest): string {
    const authorization = request.headers.authorization;
    const [scheme, token, extra] = authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token || extra) {
      throw new UnauthorizedException('需要有效的管理员 Access Token');
    }
    return token;
  }
}
