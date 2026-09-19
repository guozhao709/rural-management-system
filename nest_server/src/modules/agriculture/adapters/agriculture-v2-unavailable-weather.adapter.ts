import { Injectable } from '@nestjs/common';
import type { AgricultureV2WeatherPort } from '../ports/agriculture-v2-weather.port';

@Injectable()
export class AgricultureV2UnavailableWeatherAdapter implements AgricultureV2WeatherPort {
  async getContext(): Promise<{ availability: 'unavailable'; warning: string }> {
    return { availability: 'unavailable', warning: '天气数据当前不可用，未向分析提供模拟天气。' };
  }
}
