// Open-Meteo API 集成服务
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Cog as Fog } from 'lucide-react';

// 天气数据接口定义
export interface WeatherData {
  current: {
    temperature: number;
    weatherCode: number;
    windSpeed: number;
    humidity: number;
    visibility: number;
    apparentTemperature: number;
  };
  hourly: Array<{
    time: string;
    temperature: number;
    weatherCode: number;
  }>;
  daily: Array<{
    date: string;
    maxTemperature: number;
    minTemperature: number;
    weatherCode: number;
  }>;
  location: {
    name: string;
    timezone: string;
  };
}

// Open-Meteo API 响应接口
interface OpenMeteoResponse {
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    visibility?: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
  timezone: string;
}

// WMO 天气代码映射到图标和描述
export const getWeatherInfo = (weatherCode: number) => {
  const weatherMap: Record<number, { icon: any; description: string; condition: string }> = {
    0: { icon: Sun, description: '晴朗', condition: '晴' },
    1: { icon: Sun, description: '主要晴朗', condition: '晴' },
    2: { icon: Cloud, description: '部分多云', condition: '多云' },
    3: { icon: Cloud, description: '阴天', condition: '阴' },
    45: { icon: Fog, description: '雾', condition: '雾' },
    48: { icon: Fog, description: '结霜雾', condition: '霜雾' },
    51: { icon: CloudRain, description: '小毛毛雨', condition: '小雨' },
    53: { icon: CloudRain, description: '中毛毛雨', condition: '小雨' },
    55: { icon: CloudRain, description: '密集毛毛雨', condition: '小雨' },
    56: { icon: CloudRain, description: '轻微冻毛毛雨', condition: '冻雨' },
    57: { icon: CloudRain, description: '密集冻毛毛雨', condition: '冻雨' },
    61: { icon: CloudRain, description: '小雨', condition: '小雨' },
    63: { icon: CloudRain, description: '中雨', condition: '中雨' },
    65: { icon: CloudRain, description: '大雨', condition: '大雨' },
    66: { icon: CloudRain, description: '轻微冻雨', condition: '冻雨' },
    67: { icon: CloudRain, description: '强冻雨', condition: '冻雨' },
    71: { icon: CloudSnow, description: '小雪', condition: '小雪' },
    73: { icon: CloudSnow, description: '中雪', condition: '中雪' },
    75: { icon: CloudSnow, description: '大雪', condition: '大雪' },
    77: { icon: CloudSnow, description: '雪粒', condition: '雪' },
    80: { icon: CloudRain, description: '小阵雨', condition: '阵雨' },
    81: { icon: CloudRain, description: '中阵雨', condition: '阵雨' },
    82: { icon: CloudRain, description: '强阵雨', condition: '大雨' },
    85: { icon: CloudSnow, description: '小阵雪', condition: '阵雪' },
    86: { icon: CloudSnow, description: '强阵雪', condition: '大雪' },
    95: { icon: CloudLightning, description: '雷暴', condition: '雷暴' },
    96: { icon: CloudLightning, description: '雷暴伴小冰雹', condition: '雷暴' },
    99: { icon: CloudLightning, description: '雷暴伴大冰雹', condition: '雷暴' },
  };

  return weatherMap[weatherCode] || { icon: Cloud, description: '未知', condition: '多云' };
};

// 获取城市名称（根据经纬度）
const getCityName = (lat: number, lon: number): string => {
  // 简单的城市映射，实际应用中可以使用地理编码API
  const cities = [
    { name: '北京', lat: 39.9042, lon: 116.4074, range: 1 },
    { name: '上海', lat: 31.2304, lon: 121.4737, range: 1 },
    { name: '广州', lat: 23.1291, lon: 113.2644, range: 1 },
    { name: '深圳', lat: 22.5431, lon: 114.0579, range: 1 },
    { name: '成都', lat: 30.5728, lon: 104.0668, range: 1 },
    { name: '杭州', lat: 30.2741, lon: 120.1551, range: 1 },
  ];

  for (const city of cities) {
    if (Math.abs(city.lat - lat) < city.range && Math.abs(city.lon - lon) < city.range) {
      return city.name;
    }
  }

  return '未知地区';
};

// 获取天气数据
export const fetchWeatherData = async (
  latitude: number = 39.9042, // 默认北京
  longitude: number = 116.4074
): Promise<WeatherData> => {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current: [
        'temperature_2m',
        'relative_humidity_2m', 
        'apparent_temperature',
        'weather_code',
        'wind_speed_10m',
      ].join(','),
      hourly: [
        'temperature_2m',
        'weather_code',
      ].join(','),
      daily: [
        'temperature_2m_max',
        'temperature_2m_min',
        'weather_code',
      ].join(','),
      timezone: 'auto',
      forecast_days: '7',
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data: OpenMeteoResponse = await response.json();

    // 转换数据格式
    const weatherData: WeatherData = {
      current: {
        temperature: Math.round(data.current.temperature_2m),
        weatherCode: data.current.weather_code,
        windSpeed: Math.round(data.current.wind_speed_10m),
        humidity: data.current.relative_humidity_2m,
        visibility: data.current.visibility || 10, // 默认可见度10km
        apparentTemperature: Math.round(data.current.apparent_temperature),
      },
      hourly: data.hourly.time.slice(0, 24).map((time, index) => ({
        time: new Date(time).toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        temperature: Math.round(data.hourly.temperature_2m[index]),
        weatherCode: data.hourly.weather_code[index],
      })),
      daily: data.daily.time.map((date, index) => ({
        date,
        maxTemperature: Math.round(data.daily.temperature_2m_max[index]),
        minTemperature: Math.round(data.daily.temperature_2m_min[index]),
        weatherCode: data.daily.weather_code[index],
      })),
      location: {
        name: getCityName(latitude, longitude),
        timezone: data.timezone,
      },
    };

    return weatherData;
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    throw new Error('无法获取天气数据，请稍后重试');
  }
};

// 格式化日期为中文显示
export const formatDateToChinese = (dateString: string, index: number): string => {
  const date = new Date(dateString);
  
  if (index === 0) return '今天';
  if (index === 1) return '明天';
  
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[date.getDay()];
};
