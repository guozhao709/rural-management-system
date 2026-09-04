import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserAuthGuard } from '../auth/guards/user-auth.guard';
import type { User } from '../users/user.entity';
import { CreateHealthConsentDto } from './dto/create-health-consent.dto';
import { CreateHealthMeasurementDto } from './dto/create-health-measurement.dto';
import { QueryHealthMeasurementsDto } from './dto/query-health-measurements.dto';
import { QueryHealthTrendsDto } from './dto/query-health-trends.dto';
import { QueryPublicHealthKnowledgeDto } from './dto/query-public-health-knowledge.dto';
import { ResidentHealthRetrievalFacade } from './resident-health-retrieval.facade';
import { UpdateHealthProfileDto } from './dto/update-health-profile.dto';
import { ResidentHealthService } from './resident-health.service';
import { CreateHealthAssessmentDto, QueryHealthAssessmentsDto } from './dto/health-assessment.dto';
import { HealthAssessmentService } from './health-assessment.service';

@ApiTags('居民健康')
@ApiBearerAuth()
@UseGuards(UserAuthGuard)
@Controller('api/v2/health')
export class ResidentHealthController {
  constructor(
    private readonly health: ResidentHealthService,
    private readonly publicKnowledge: ResidentHealthRetrievalFacade,
    private readonly assessments: HealthAssessmentService,
  ) {}

  @Post('consents') grantConsent(@CurrentUser() user: User, @Body() dto: CreateHealthConsentDto) {
    return this.health.grantConsent(user, dto);
  }
  @Get('consents/current') getCurrentConsent(@CurrentUser() user: User) {
    return this.health.getCurrentConsent(user);
  }
  @Delete('consents/current')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  revokeConsent(@CurrentUser() user: User) {
    return this.health.revokeCurrentConsent(user);
  }

  @Get('profile') @ApiOkResponse() getProfile(@CurrentUser() user: User) {
    return this.health.getProfile(user);
  }
  @Patch('profile') updateProfile(@CurrentUser() user: User, @Body() dto: UpdateHealthProfileDto) {
    return this.health.updateProfile(user, dto);
  }

  @Get('knowledge') searchKnowledge(@Query() query: QueryPublicHealthKnowledgeDto) {
    return this.publicKnowledge.searchPublicKnowledge({
      query: query.keyword ?? '',
      limit: query.pageSize,
    });
  }
  @Get('knowledge/:id') getKnowledge(@Param('id') id: string) {
    return this.publicKnowledge.getPublicKnowledge(id);
  }

  @Post('measurements') createMeasurement(
    @CurrentUser() user: User,
    @Body() dto: CreateHealthMeasurementDto,
  ) {
    return this.health.createMeasurement(user, dto);
  }
  @Get('measurements') listMeasurements(
    @CurrentUser() user: User,
    @Query() query: QueryHealthMeasurementsDto,
  ) {
    return this.health.listMeasurements(user, query);
  }
  @Get('measurements/trends') trend(
    @CurrentUser() user: User,
    @Query() query: QueryHealthTrendsDto,
  ) {
    return this.health.measurementTrend(user, query);
  }
  @Delete('measurements/:id') @HttpCode(HttpStatus.NO_CONTENT) deleteMeasurement(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.health.deleteMeasurement(user, id);
  }

  @Post('assessments') createAssessment(
    @CurrentUser() user: User,
    @Body() dto: CreateHealthAssessmentDto,
  ) {
    return this.assessments.create(user, dto);
  }
  @Get('assessments') listAssessments(
    @CurrentUser() user: User,
    @Query() query: QueryHealthAssessmentsDto,
  ) {
    return this.assessments.list(user, query);
  }
  @Get('assessments/:id') getAssessment(@CurrentUser() user: User, @Param('id') id: string) {
    return this.assessments.getOne(user, id);
  }
  @Delete('assessments/:id') @HttpCode(HttpStatus.NO_CONTENT) deleteAssessment(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.assessments.remove(user, id);
  }
}
