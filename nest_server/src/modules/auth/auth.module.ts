import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Admin } from '../admins/admin.entity';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { AdminAuthController } from './admin-auth.controller';
import { AuthService } from './auth.service';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { UserAuthGuard } from './guards/user-auth.guard';
import { AuthCookieService } from './services/auth-cookie.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { UserAuthController } from './user-auth.controller';

@Global()
@Module({
  imports: [JwtModule.register({}), MikroOrmModule.forFeature([Admin, User]), UsersModule],
  controllers: [UserAuthController, AdminAuthController],
  providers: [
    AuthService,
    TokenService,
    PasswordService,
    AuthCookieService,
    UserAuthGuard,
    AdminAuthGuard,
    RolesGuard,
  ],
  exports: [AuthService, UserAuthGuard, AdminAuthGuard, RolesGuard],
})
export class AuthModule {}
