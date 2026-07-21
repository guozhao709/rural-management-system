const REQUEST_TIMEOUT_MS = 8000;
const DEFAULT_CITY = "西安";

const weatherCodeMap = {
  0: "晴",
  1: "大部晴朗",
  2: "局部多云",
  3: "阴",
  45: "雾",
  48: "雾凇",
  51: "小毛毛雨",
  53: "中等毛毛雨",
  55: "大毛毛雨",
  56: "冻毛毛雨",
  57: "强冻毛毛雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  66: "冻雨",
  67: "强冻雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  77: "雪粒",
  80: "小阵雨",
  81: "中等阵雨",
  82: "强阵雨",
  85: "小阵雪",
  86: "强阵雪",
  95: "雷暴",
  96: "雷暴伴小冰雹",
  99: "雷暴伴强冰雹",
};

const getWeatherText = (code) => {
  return weatherCodeMap[code] || "未知天气";
};

const fetchJson = async (url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
};

const buildGeocodingUrl = (city) => {
  const params = new URLSearchParams({
    name: city,
    count: "1",
    language: "zh",
    countryCode: "CN",
    format: "json",
  });

  return `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`;
};

const buildForecastUrl = ({ latitude, longitude }) => {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "precipitation",
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "wind_speed_10m_max",
    ].join(","),
    forecast_days: "3",
    timezone: "auto",
  });

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
};

const findCityLocation = async (city) => {
  const geocodingData = await fetchJson(buildGeocodingUrl(city));
  const location = geocodingData?.results?.[0];

  if (!location) {
    return null;
  }

  return {
    name: location.name,
    admin1: location.admin1,
    country: location.country,
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: location.timezone,
  };
};

const formatDailyForecast = (daily, index, label) => {
  const date = daily?.time?.[index] || "未知日期";
  const code = daily?.weather_code?.[index];
  const maxTemperature = daily?.temperature_2m_max?.[index];
  const minTemperature = daily?.temperature_2m_min?.[index];
  const precipitationProbability = daily?.precipitation_probability_max?.[index];
  const maxWindSpeed = daily?.wind_speed_10m_max?.[index];

  return `${label}（${date}）：${getWeatherText(code)}，${minTemperature ?? "-"}℃~${maxTemperature ?? "-"}℃，降水概率 ${precipitationProbability ?? "-"}%，最大风速 ${maxWindSpeed ?? "-"} km/h`;
};

const buildSuggestion = (currentCode, precipitationProbability) => {
  const weatherText = getWeatherText(currentCode);

  if (weatherText.includes("雷暴")) {
    return "有雷暴风险，建议减少户外活动，田间作业注意避雷和安全撤离。";
  }

  if (weatherText.includes("雨") || Number(precipitationProbability) >= 60) {
    return "可能有降水，出行建议带伞，农业生产注意排水和防涝。";
  }

  if (weatherText.includes("雪")) {
    return "有降雪可能，注意道路湿滑，设施农业注意保温和棚体安全。";
  }

  if (weatherText.includes("雾")) {
    return "能见度可能较低，出行注意交通安全。";
  }

  return "天气整体较平稳，可根据温度变化合理安排出行和农事活动。";
};

const formatWeatherResult = (city, location, forecastData) => {
  const current = forecastData?.current || {};
  const daily = forecastData?.daily || {};
  const todayPrecipitationProbability = daily?.precipitation_probability_max?.[0];
  const placeName = [location.name || city, location.admin1, location.country]
    .filter(Boolean)
    .join("，");

  return [
    `城市：${placeName}`,
    `数据来源：Open-Meteo 实时天气与未来 3 天预报`,
    `更新时间：${current.time || "未知"}`,
    `当前天气：${getWeatherText(current.weather_code)}，气温 ${current.temperature_2m ?? "-"}℃，体感 ${current.apparent_temperature ?? "-"}℃`,
    `湿度：${current.relative_humidity_2m ?? "-"}%`,
    `风速：${current.wind_speed_10m ?? "-"} km/h，风向 ${current.wind_direction_10m ?? "-"}°`,
    `降水：${current.precipitation ?? "-"} mm`,
    formatDailyForecast(daily, 0, "今天"),
    formatDailyForecast(daily, 1, "明天"),
    formatDailyForecast(daily, 2, "后天"),
    `建议：${buildSuggestion(current.weather_code, todayPrecipitationProbability)}`,
  ].join("\n");
};

export const weatherService = {
  async getWeather(city) {
    const normalizedCity = typeof city === "string" ? city.trim() : "";
    const targetCity = normalizedCity || DEFAULT_CITY;

    try {
      const location = await findCityLocation(targetCity);

      if (!location) {
        return `未查询到“${targetCity}”的城市位置，请换一个更明确的城市名称，例如“西安”或“北京市”。`;
      }

      const forecastData = await fetchJson(buildForecastUrl(location));
      return formatWeatherResult(targetCity, location, forecastData);
    } catch (error) {
      console.error("天气服务查询失败:", error);
      return `天气服务暂时不可用，未能获取“${targetCity}”的实时天气。请稍后再试。`;
    }
  },
};
