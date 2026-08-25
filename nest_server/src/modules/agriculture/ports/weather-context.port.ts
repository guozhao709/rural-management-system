export const WEATHER_CONTEXT_PORT = Symbol('WEATHER_CONTEXT_PORT');
export interface WeatherContextPort {
  getContext(
    regionCode: string,
  ): Promise<{ available: boolean; warning?: string; source?: string }>;
}
