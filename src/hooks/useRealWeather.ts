import { useState, useEffect, useCallback } from 'react';

export interface HourlyForecast {
  time: string;
  hour: number;
  temp: number;
  condition: WeatherCondition;
  humidity: number;
  windSpeed: number;
  precipProb: number;
}

export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'windy' | 'snowy' | 'partly_cloudy' | 'foggy';

export interface RealWeatherData {
  temp: number;
  feelsLike: number;
  condition: WeatherCondition;
  conditionLabel: string;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  visibility: number;
  uvIndex: number;
  pressure: number;
  precipProb: number;
  hourlyForecast: HourlyForecast[];
  locationName: string;
  lastUpdated: Date;
  isLoading: boolean;
  error: string | null;
  roadWarning?: string;
  refreshFromGPS: () => void;
  isLocating: boolean;
}

// WMO weather interpretation codes → condition
function wmoToCondition(code: number): { condition: WeatherCondition; label: string } {
  if (code === 0) return { condition: 'sunny', label: 'صافي' };
  if (code === 1) return { condition: 'sunny', label: 'صافي غالباً' };
  if (code === 2) return { condition: 'partly_cloudy', label: 'غائم جزئياً' };
  if (code === 3) return { condition: 'cloudy', label: 'غائم' };
  if (code === 45 || code === 48) return { condition: 'foggy', label: 'ضبابي' };
  if ([51, 53, 55, 56, 57].includes(code)) return { condition: 'rainy', label: 'رذاذ' };
  if ([61, 63, 65, 66, 67].includes(code)) return { condition: 'rainy', label: 'ممطر' };
  if ([71, 73, 75, 77].includes(code)) return { condition: 'snowy', label: 'ثلوج' };
  if ([80, 81, 82].includes(code)) return { condition: 'rainy', label: 'أمطار غزيرة' };
  if ([85, 86].includes(code)) return { condition: 'snowy', label: 'عواصف ثلجية' };
  if ([95, 96, 99].includes(code)) return { condition: 'stormy', label: 'عاصفة رعدية' };
  return { condition: 'cloudy', label: 'غائم' };
}

function getRoadWarning(weatherCode: number, windSpeed: number, visibility?: number): string | undefined {
  if ([95, 96, 99].includes(weatherCode)) return '⚠️ عاصفة رعدية - قيادة خطرة';
  if ([65, 67, 82].includes(weatherCode)) return '⚠️ أمطار غزيرة - انزلاق الطرق';
  if ([45, 48].includes(weatherCode)) return '⚠️ ضباب كثيف - رؤية محدودة';
  if (windSpeed > 50) return '⚠️ رياح شديدة - خطر على الشاحنات';
  if (windSpeed > 35) return '⚡ رياح قوية - توخي الحذر';
  if ([71, 73, 75].includes(weatherCode)) return '❄️ ثلوج - طرق زلقة';
  return undefined;
}

const DEFAULT_LAT = 30.0444; // Cairo
const DEFAULT_LNG = 31.2357;

export function useRealWeather(refreshIntervalMs = 15 * 60 * 1000) {
  const [data, setData] = useState<RealWeatherData>({
    temp: 0, feelsLike: 0, condition: 'sunny', conditionLabel: 'جاري التحميل...',
    humidity: 0, windSpeed: 0, windDirection: 0, visibility: 10, uvIndex: 0,
    pressure: 1013, precipProb: 0, hourlyForecast: [], locationName: '',
    lastUpdated: new Date(), isLoading: true, error: null,
  });

  const fetchWeather = useCallback(async (lat: number, lng: number) => {
    try {
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lng.toString(),
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,uv_index,precipitation_probability',
        hourly: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation_probability',
        forecast_hours: '12',
        timezone: 'auto',
      });

      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
      const json = await res.json();

      const current = json.current;
      const { condition, label } = wmoToCondition(current.weather_code);
      const roadWarning = getRoadWarning(current.weather_code, current.wind_speed_10m);

      // Parse hourly
      const hourly: HourlyForecast[] = (json.hourly?.time || []).map((t: string, i: number) => {
        const date = new Date(t);
        const hCode = json.hourly.weather_code?.[i] ?? 0;
        return {
          time: t,
          hour: date.getHours(),
          temp: Math.round(json.hourly.temperature_2m?.[i] ?? 0),
          condition: wmoToCondition(hCode).condition,
          humidity: json.hourly.relative_humidity_2m?.[i] ?? 0,
          windSpeed: Math.round(json.hourly.wind_speed_10m?.[i] ?? 0),
          precipProb: json.hourly.precipitation_probability?.[i] ?? 0,
        };
      });

      // Reverse geocode for location name
      let locationName = 'الموقع الحالي';
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar&zoom=10`,
          { headers: { 'User-Agent': 'iRecycle-App/1.0' } }
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          locationName = geoData.address?.city || geoData.address?.town || geoData.address?.state || 'الموقع الحالي';
        }
      } catch {}

      setData({
        temp: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        condition: current.wind_speed_10m > 40 ? 'windy' : condition,
        conditionLabel: current.wind_speed_10m > 40 ? 'رياح شديدة' : label,
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        windDirection: current.wind_direction_10m,
        visibility: 10,
        uvIndex: Math.round(current.uv_index ?? 0),
        pressure: Math.round(current.surface_pressure ?? 1013),
        precipProb: current.precipitation_probability ?? 0,
        hourlyForecast: hourly,
        locationName,
        lastUpdated: new Date(),
        isLoading: false,
        error: null,
        roadWarning,
      });
    } catch (err: any) {
      console.error('Weather fetch error:', err);
      setData(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  }, []);

  useEffect(() => {
    let lat = DEFAULT_LAT;
    let lng = DEFAULT_LNG;

    const doFetch = (la: number, ln: number) => {
      fetchWeather(la, ln);
      const interval = setInterval(() => fetchWeather(la, ln), refreshIntervalMs);
      return () => clearInterval(interval);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          doFetch(lat, lng);
        },
        () => doFetch(lat, lng),
        { timeout: 5000, enableHighAccuracy: false }
      );
    } else {
      doFetch(lat, lng);
    }

    // Also schedule a refresh regardless
    const fallbackTimer = setTimeout(() => fetchWeather(lat, lng), 3000);
    fetchWeather(lat, lng);

    return () => clearTimeout(fallbackTimer);
  }, [fetchWeather, refreshIntervalMs]);

  return data;
}
