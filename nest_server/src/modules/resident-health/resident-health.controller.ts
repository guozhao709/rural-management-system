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
import { UpdateHealthProfileDto } from './dto/update-health-profile.dto';
import { ResidentHealthService } from './resident-health.service';

@ApiTags('居民健康')
@ApiBearerAuth()
@UseGuards(UserAuthGuard)
@Controller('api/v2/health')
export class ResidentHealthController {
  constructor(private readonly health: ResidentHealthService) {}

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
}
