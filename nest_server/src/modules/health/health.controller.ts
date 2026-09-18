import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserAuthGuard } from '../auth/guards/user-auth.guard';
import type { User } from '../users/user.entity';
import { HealthService } from './health.service';
import { HealthMetricRecord } from './entities/health-metric-record.entity';
import { HealthMetricTemplate } from './entities/health-metric-template.entity';
import { HealthProfile } from './entities/health-profile.entity';
import { analysesQuerySchema, analysisInputSchema, knowledgeQuerySchema, metricSchema, metricsQuerySchema, parse, profileSchema, templatePatchSchema, templateSchema, templatesQuerySchema } from './health.schemas';
import { HealthAnalysisService } from './health-analysis.service';

@ApiTags('健康')
@ApiBearerAuth()
@UseGuards(UserAuthGuard)
@Controller('api/health')
export class HealthController {
  constructor(private readonly health: HealthService, private readonly analyses: HealthAnalysisService) {}

  @Get('profile') async getProfile(@CurrentUser() user: User) { const profile = await this.health.getProfile(user.id); return profile ? this.profile(profile) : null; }
  @Put('profile') async putProfile(@CurrentUser() user: User, @Body() body: unknown) { return this.profile(await this.health.putProfile(user.id, parse(profileSchema, body))); }
  @Get('metrics') async listMetrics(@CurrentUser() user: User, @Query() query: unknown) { const result = await this.health.listMetrics(user.id, parse(metricsQuerySchema, query)); return { ...result, items: result.items.map((item) => this.metric(item)) }; }
  @Post('metrics') async createMetric(@CurrentUser() user: User, @Body() body: unknown) { return this.metric(await this.health.createMetric(user.id, parse(metricSchema, body))); }
  @Delete('metrics/:id') async deleteMetric(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) { await this.health.deleteMetric(user.id, id); }
  @Get('metrics/trend') async metricTrend(@CurrentUser() user: User, @Query() query: Record<string, unknown>) { const parsed = parse(metricsQuerySchema, query); if (parsed.templateId && parsed.metricType) throw new BadRequestException('templateId 与 metricType 不能同时提供'); if (!parsed.templateId && (!parsed.metricType || parsed.metricType === 'custom')) throw new BadRequestException('必须提供系统 metricType 或 templateId'); return this.health.trend(user.id, { metricType: parsed.metricType === 'custom' ? undefined : parsed.metricType, templateId: parsed.templateId, from: parsed.from, to: parsed.to }); }
  @Get('metric-templates') async listTemplates(@CurrentUser() user: User, @Query() query: unknown) { const result = await this.health.listTemplates(user.id, parse(templatesQuerySchema, query)); return { ...result, items: result.items.map((item) => this.template(item)) }; }
  @Post('metric-templates') async createTemplate(@CurrentUser() user: User, @Body() body: unknown) { return this.template(await this.health.createTemplate(user.id, parse(templateSchema, body))); }
  @Get('metric-templates/:id') async getTemplate(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) { return this.template(await this.health.getTemplate(user.id, id)); }
  @Patch('metric-templates/:id') async patchTemplate(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number, @Body() body: unknown) { return this.template(await this.health.patchTemplate(user.id, id, parse(templatePatchSchema, body))); }
  @Get('knowledge') async listKnowledge(@Query() query: unknown) { const result = await this.health.listKnowledge(parse(knowledgeQuerySchema, query)); return { ...result, items: result.items.map((item) => ({ id: item.id, title: item.title, summary: item.summary, category: item.category, tags: item.tags, sourceName: item.sourceName })) }; }
  @Get('knowledge/:id') async getKnowledge(@Param('id', ParseIntPipe) id: number) { const item = await this.health.getKnowledge(id); return { id: item.id, title: item.title, summary: item.summary, content: item.content, category: item.category, tags: item.tags, source: { name: item.sourceName, url: item.sourceUrl }, createdAt: item.createdAt, updatedAt: item.updatedAt }; }
  @Post('analyses') async createAnalysis(@CurrentUser() user: User, @Body() body: unknown) { return this.analysisResult(await this.analyses.create(user.id, parse(analysisInputSchema, body))); }
  @Get('analyses') async listAnalyses(@CurrentUser() user: User, @Query() query: unknown) { const result = await this.analyses.list(user.id, parse(analysesQuerySchema, query)); return { ...result, items: result.items.map((item) => { const input = item.inputSnapshot as { symptoms: string[]; severity: string }; const result = item.resultSnapshot as { summary: string }; return { id: item.id, symptoms: input.symptoms, severity: input.severity, summary: result.summary, createdAt: item.createdAt }; }) }; }
  @Get('analyses/:id') async getAnalysis(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) { return this.analysisDetail(await this.analyses.get(user.id, id)); }

  private profile(item: HealthProfile) { return { id: item.id, sex: item.sex, birthDate: item.birthDate, heightCm: item.heightCm === null ? null : Number(item.heightCm), smokingStatus: item.smokingStatus, drinkingStatus: item.drinkingStatus, exerciseStatus: item.exerciseStatus, sleepStatus: item.sleepStatus, healthHistory: item.healthHistory, allergies: item.allergies, createdAt: item.createdAt, updatedAt: item.updatedAt }; }
  private metric(item: HealthMetricRecord) { const base = { id: item.id, metricType: item.metricType, unit: item.unit, measuredAt: item.measuredAt, createdAt: item.createdAt }; return item.metricType === 'blood_pressure' ? { ...base, systolic: Number(item.systolicValue), diastolic: Number(item.diastolicValue) } : { ...base, value: Number(item.numericValue) }; }
  private template(item: HealthMetricTemplate) { return { id: item.id, name: item.name, metricName: item.metricName, unit: item.unit, relatedSystemMetricType: item.relatedSystemMetricType, startedAt: item.startedAt, endedAt: item.endedAt, createdAt: item.createdAt, updatedAt: item.updatedAt }; }
  private analysisResult(item: { id: number; resultSnapshot: object; createdAt: Date }) { return { id: item.id, ...item.resultSnapshot, createdAt: item.createdAt }; }
  private analysisDetail(item: { id: number; inputSnapshot: object; contextSnapshot: object; resultSnapshot: object; createdAt: Date }) { return { id: item.id, input: item.inputSnapshot, context: item.contextSnapshot, result: item.resultSnapshot, createdAt: item.createdAt }; }
}
