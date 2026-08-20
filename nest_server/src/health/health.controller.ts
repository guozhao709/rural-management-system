import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import type { LivenessStatus, ReadinessStatus } from './health.service';
import { HealthService } from './health.service';

@ApiTags('system')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: '检查 HTTP 服务是否存活' })
  @ResponseMessage('服务正常')
  getLiveness(): LivenessStatus {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @ApiOperation({ summary: '检查服务和 PostgreSQL 是否就绪' })
  @ResponseMessage('服务已就绪')
  getReadiness(): Promise<ReadinessStatus> {
    return this.healthService.getReadiness();
  }
}
