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
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserLoginDto } from './dto/user-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserAuthGuard } from './guards/user-auth.guard';
import { AuthUserPresenter, UserAuthResponsePresenter } from './presenters/auth.presenter';
import { AuthCookieService } from './services/auth-cookie.service';
import type { User } from '../users/user.entity';

@ApiTags('用户认证')
@Controller('api/v2/auth/user')
export class UserAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieService: AuthCookieService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: '普通用户注册并登录' })
  @ApiCreatedResponse({ type: UserAuthResponsePresenter })
  async register(
    @Body() dto: UserRegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserAuthResponsePresenter> {
    const session = await this.authService.registerUser(dto);
    this.cookieService.setRefreshToken(
      response,
      'user',
      session.refreshToken,
      session.refreshExpiresAt,
    );
    return session.response;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '普通用户登录' })
  @ApiOkResponse({ type: UserAuthResponsePresenter })
  async login(
    @Body() dto: UserLoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserAuthResponsePresenter> {
    const session = await this.authService.loginUser(dto);
    this.cookieService.setRefreshToken(
      response,
      'user',
      session.refreshToken,
      session.refreshExpiresAt,
    );
    return session.response;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('zhixiangyun_user_refresh')
  @ApiOperation({ summary: '轮换用户 Refresh Token 并签发新 Access Token' })
  @ApiOkResponse({ type: UserAuthResponsePresenter })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserAuthResponsePresenter> {
    const token = this.cookieService.getRefreshToken(request, 'user');
    if (!token) throw new UnauthorizedException('Refresh Token 无效');
    const session = await this.authService.refreshUser(token);
    this.cookieService.setRefreshToken(
      response,
      'user',
      session.refreshToken,
      session.refreshExpiresAt,
    );
    return session.response;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth('zhixiangyun_user_refresh')
  @ApiOperation({ summary: '退出用户登录并撤销当前 Refresh Token' })
  @ApiNoContentResponse()
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logoutUser(this.cookieService.getRefreshToken(request, 'user'));
    this.cookieService.clearRefreshToken(response, 'user');
  }

  @Get('me')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '查询当前用户' })
  @ApiOkResponse({ type: AuthUserPresenter })
  me(@CurrentUser() user: User): AuthUserPresenter {
    return AuthUserPresenter.from(user);
  }
}
