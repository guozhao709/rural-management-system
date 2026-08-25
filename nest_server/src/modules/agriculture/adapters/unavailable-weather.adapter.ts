import { Injectable } from '@nestjs/common';
import type { WeatherContextPort } from '../ports/weather-context.port';
@Injectable()
export class UnavailableWeatherAdapter implements WeatherContextPort {
  async getContext() {
    return { available: false, warning: '实时天气未接入' };
  }
}
