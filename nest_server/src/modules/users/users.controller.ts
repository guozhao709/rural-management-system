import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { AdminRole } from '../admins/admin.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserListPresenter, UserPresenter } from './presenters/user.presenter';
import { UsersService } from './users.service';

@ApiTags('用户管理')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(AdminRole.SuperAdmin, AdminRole.Admin)
@Controller('api/v2/admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: '由管理员创建用户（非注册接口）' })
  @ApiCreatedResponse({ type: UserPresenter })
  @ResponseMessage('用户创建成功')
  create(@Body() dto: CreateUserDto): Promise<UserPresenter> {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '分页查询用户' })
  @ApiOkResponse({ type: UserListPresenter })
  findAll(@Query() query: QueryUserDto): Promise<UserListPresenter> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询用户详情' })
  @ApiOkResponse({ type: UserPresenter })
  @ApiNotFoundResponse({ description: '用户不存在或已删除' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<UserPresenter> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '部分更新用户' })
  @ApiOkResponse({ type: UserPresenter })
  @ResponseMessage('用户更新成功')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<UserPresenter> {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '软删除用户' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.remove(id);
  }
}
