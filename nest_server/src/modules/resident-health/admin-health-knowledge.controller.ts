import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '../admins/admin.entity';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Admin } from '../admins/admin.entity';
import {
  CreateHealthKnowledgeDto,
  PublishHealthKnowledgeDto,
  QueryHealthKnowledgeDto,
  UpdateHealthKnowledgeDto,
} from './dto/health-knowledge.dto';
import { HealthKnowledgeService } from './health-knowledge.service';

@ApiTags('健康知识管理')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(AdminRole.Admin, AdminRole.SuperAdmin)
@Controller('api/v2/admin/health/knowledge')
export class AdminHealthKnowledgeController {
  constructor(private readonly knowledge: HealthKnowledgeService) {}
  @Get() list(@Query() query: QueryHealthKnowledgeDto) {
    return this.knowledge.list(query);
  }
  @Post() create(@Body() dto: CreateHealthKnowledgeDto) {
    return this.knowledge.createDraft(dto);
  }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateHealthKnowledgeDto) {
    return this.knowledge.updateDraft(id, dto);
  }
  @Post(':id/submit-review') submit(@Param('id') id: string) {
    return this.knowledge.submitReview(id);
  }
  @Post(':id/publish') @Roles(AdminRole.SuperAdmin) publish(
    @Param('id') id: string,
    @CurrentAdmin() admin: Admin,
    @Body() dto: PublishHealthKnowledgeDto,
  ) {
    return this.knowledge.publish(id, admin, dto);
  }
  @Post(':id/archive') @Roles(AdminRole.SuperAdmin) archive(@Param('id') id: string) {
    return this.knowledge.archive(id);
  }
  @Get('review-due') reviewDue() {
    return this.knowledge.reviewDue();
  }
}
