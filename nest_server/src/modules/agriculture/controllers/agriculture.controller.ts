import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '../../admins/admin.entity';
import { CurrentAdmin } from '../../auth/decorators/current-admin.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserAuthGuard } from '../../auth/guards/user-auth.guard';
import type { Admin } from '../../admins/admin.entity';
import type { User } from '../../users/user.entity';
import {
  CreateAliasDto,
  CreateAnalysisDto,
  CreateCropDto,
  CreateKnowledgeDto,
  CropQueryDto,
  AnalysisQueryDto,
  KnowledgeQueryDto,
  UpdateCropDto,
  UpdateKnowledgeDto,
} from '../dto/agriculture.dto';
import { AgricultureAnalysisService } from '../services/agriculture-analysis.service';
import { AgricultureKnowledgeService } from '../services/agriculture-knowledge.service';
import { CropCatalogService } from '../services/crop-catalog.service';
import {
  AnalysisPresenter,
  CropPresenter,
  KnowledgePresenter,
} from '../presenters/agriculture.presenter';
@ApiTags('农业')
@ApiBearerAuth()
@UseGuards(UserAuthGuard)
@Controller('api/v2/agriculture')
export class AgricultureController {
  constructor(
    private readonly crops: CropCatalogService,
    private readonly knowledge: AgricultureKnowledgeService,
    private readonly analyses: AgricultureAnalysisService,
  ) {}
  @Get('crops') cropsList(@Query() q: CropQueryDto) {
    return this.crops
      .list(q)
      .then((page) => ({ ...page, list: page.list.map((item) => CropPresenter.from(item)) }));
  }
  @Get('knowledge') knowledgeList(@Query() q: KnowledgeQueryDto) {
    return this.knowledge
      .list(q, true)
      .then((page) => ({ ...page, list: page.list.map((item) => KnowledgePresenter.from(item)) }));
  }
  @Get('knowledge/:id') knowledgeOne(@Param('id', ParseIntPipe) id: number) {
    return this.knowledge.findPublished(id).then((item) => KnowledgePresenter.from(item, true));
  }
  @Post('analyses') create(@Body() d: CreateAnalysisDto, @CurrentUser() user: User) {
    return this.analyses.create(d, user).then((item) => AnalysisPresenter.from(item));
  }
  @Get('analyses') analysesList(@Query() q: AnalysisQueryDto, @CurrentUser() user: User) {
    return this.analyses
      .list(user, q)
      .then((page) => ({ ...page, list: page.list.map((item) => AnalysisPresenter.from(item)) }));
  }
  @Get('analyses/:id') analysisOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.analyses.findOne(user, id).then((item) => AnalysisPresenter.from(item));
  }
}
@ApiTags('农业管理')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(AdminRole.Admin, AdminRole.SuperAdmin)
@Controller('api/v2/admin/agriculture')
export class AdminAgricultureController {
  constructor(
    private readonly crops: CropCatalogService,
    private readonly knowledge: AgricultureKnowledgeService,
  ) {}
  @Get('crops') cropsList(@Query() q: CropQueryDto) {
    return this.crops
      .list(q, false)
      .then((page) => ({ ...page, list: page.list.map((item) => CropPresenter.from(item)) }));
  }
  @Post('crops') cropCreate(@Body() d: CreateCropDto) {
    return this.crops.create(d).then((item) => CropPresenter.from(item));
  }
  @Patch('crops/:id') cropUpdate(@Param('id', ParseIntPipe) id: number, @Body() d: UpdateCropDto) {
    return this.crops.update(id, d).then((item) => CropPresenter.from(item));
  }
  @Post('crops/:id/aliases') addAlias(
    @Param('id', ParseIntPipe) id: number,
    @Body() d: CreateAliasDto,
  ) {
    return this.crops.addAlias(id, d);
  }
  @Delete('crops/:id/aliases/:aliasId') removeAlias(
    @Param('id', ParseIntPipe) id: number,
    @Param('aliasId', ParseIntPipe) aliasId: number,
  ) {
    return this.crops.removeAlias(id, aliasId);
  }
  @Get('knowledge') list(@Query() q: KnowledgeQueryDto) {
    return this.knowledge
      .list(q, false)
      .then((page) => ({ ...page, list: page.list.map((item) => KnowledgePresenter.from(item)) }));
  }
  @Post('knowledge') create(@Body() d: CreateKnowledgeDto, @CurrentAdmin() a: Admin) {
    return this.knowledge.create(d, a).then((item) => KnowledgePresenter.from(item, true));
  }
  @Get('knowledge/:id') one(@Param('id', ParseIntPipe) id: number) {
    return this.knowledge.getAdmin(id).then((item) => KnowledgePresenter.from(item, true));
  }
  @Patch('knowledge/:id') update(
    @Param('id', ParseIntPipe) id: number,
    @Body() d: UpdateKnowledgeDto,
    @CurrentAdmin() a: Admin,
  ) {
    return this.knowledge.update(id, d, a).then((item) => KnowledgePresenter.from(item, true));
  }
  @Post('knowledge/:id/publish') publish(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAdmin() a: Admin,
  ) {
    return this.knowledge.publish(id, a).then((item) => KnowledgePresenter.from(item, true));
  }
  @Post('knowledge/:id/archive') archive(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAdmin() a: Admin,
  ) {
    return this.knowledge.archive(id, a).then((item) => KnowledgePresenter.from(item, true));
  }
  @Delete('knowledge/:id') @Roles(AdminRole.SuperAdmin) remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.knowledge.remove(id);
  }
}
