export const AGRICULTURE_V2_WEATHER_PORT = Symbol('AGRICULTURE_V2_WEATHER_PORT');

export interface AgricultureV2WeatherPort {
  getContext(region: { province: string; city: string; district: string }): Promise<{ availability: 'available' | 'unavailable'; summary?: string; warning?: string }>;
}
