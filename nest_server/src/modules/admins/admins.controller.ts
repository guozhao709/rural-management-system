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
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminRole } from './admin.entity';
import { AdminsService } from './admins.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { QueryAdminDto } from './dto/query-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { AdminListPresenter, AdminPresenter } from './presenters/admin.presenter';

@ApiTags('管理员管理')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(AdminRole.SuperAdmin)
@Controller('api/v2/admin/admins')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Post()
  @ApiOperation({ summary: '由 super_admin 创建管理员（非注册接口）' })
  @ApiCreatedResponse({ type: AdminPresenter })
  @ResponseMessage('管理员创建成功')
  create(@Body() dto: CreateAdminDto): Promise<AdminPresenter> {
    return this.adminsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '分页查询管理员' })
  @ApiOkResponse({ type: AdminListPresenter })
  findAll(@Query() query: QueryAdminDto): Promise<AdminListPresenter> {
    return this.adminsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询管理员详情' })
  @ApiOkResponse({ type: AdminPresenter })
  @ApiNotFoundResponse({ description: '管理员不存在或已删除' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<AdminPresenter> {
    return this.adminsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '部分更新管理员' })
  @ApiOkResponse({ type: AdminPresenter })
  @ResponseMessage('管理员更新成功')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminDto,
  ): Promise<AdminPresenter> {
    return this.adminsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '软删除管理员' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.adminsService.remove(id);
  }
}
