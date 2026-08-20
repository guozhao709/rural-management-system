import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import type { Admin } from '../admins/admin.entity';
import { AuthService } from './auth.service';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminAuthResponsePresenter, AuthAdminPresenter } from './presenters/auth.presenter';
import { AuthCookieService } from './services/auth-cookie.service';

@ApiTags('管理员认证')
@Controller('api/v2/auth/admin')
export class AdminAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieService: AuthCookieService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '管理员登录' })
  @ApiOkResponse({ type: AdminAuthResponsePresenter })
  async login(
    @Body() dto: AdminLoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AdminAuthResponsePresenter> {
    const session = await this.authService.loginAdmin(dto);
    this.cookieService.setRefreshToken(
      response,
      'admin',
      session.refreshToken,
      session.refreshExpiresAt,
    );
    return session.response;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('zhixiangyun_admin_refresh')
  @ApiOperation({ summary: '轮换管理员 Refresh Token 并签发新 Access Token' })
  @ApiOkResponse({ type: AdminAuthResponsePresenter })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AdminAuthResponsePresenter> {
    const token = this.cookieService.getRefreshToken(request, 'admin');
    if (!token) throw new UnauthorizedException('Refresh Token 无效');
    const session = await this.authService.refreshAdmin(token);
    this.cookieService.setRefreshToken(
      response,
      'admin',
      session.refreshToken,
      session.refreshExpiresAt,
    );
    return session.response;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth('zhixiangyun_admin_refresh')
  @ApiOperation({ summary: '退出管理员登录并撤销当前 Refresh Token' })
  @ApiNoContentResponse()
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logoutAdmin(this.cookieService.getRefreshToken(request, 'admin'));
    this.cookieService.clearRefreshToken(response, 'admin');
  }

  @Get('me')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '查询当前管理员和实时角色' })
  @ApiOkResponse({ type: AuthAdminPresenter })
  me(@CurrentAdmin() admin: Admin): AuthAdminPresenter {
    return AuthAdminPresenter.from(admin);
  }
}
