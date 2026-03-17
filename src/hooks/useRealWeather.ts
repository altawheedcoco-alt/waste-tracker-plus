import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

function getRoadWarning(weatherCode: number, windSpeed: number): string | undefined {
  if ([95, 96, 99].includes(weatherCode)) return '⚠️ عاصفة رعدية - قيادة خطرة';
  if ([65, 67, 82].includes(weatherCode)) return '⚠️ أمطار غزيرة - انزلاق الطرق';
  if ([45, 48].includes(weatherCode)) return '⚠️ ضباب كثيف - رؤية محدودة';
  if (windSpeed > 50) return '⚠️ رياح شديدة - خطر على الشاحنات';
  if (windSpeed > 35) return '⚡ رياح قوية - توخي الحذر';
  if ([71, 73, 75].includes(weatherCode)) return '❄️ ثلوج - طرق زلقة';
  return undefined;
}

const DEFAULT_LAT = 30.0444;
const DEFAULT_LNG = 31.2357;

export function useRealWeather(refreshIntervalMs = 15 * 60 * 1000) {
  const [isLocating, setIsLocating] = useState(false);
  const fetchingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCoordsRef = useRef({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });

  const [data, setData] = useState<Omit<RealWeatherData, 'refreshFromGPS' | 'isLocating'>>({
    temp: 0, feelsLike: 0, condition: 'sunny', conditionLabel: 'جاري التحميل...',
    humidity: 0, windSpeed: 0, windDirection: 0, visibility: 10, uvIndex: 0,
    pressure: 1013, precipProb: 0, hourlyForecast: [], locationName: '',
    lastUpdated: new Date(), isLoading: true, error: null,
  });

  const fetchWeather = useCallback(async (lat: number, lng: number) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    lastCoordsRef.current = { lat, lng };

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(
        `${supabaseUrl}/functions/v1/weather-proxy?lat=${lat}&lng=${lng}`,
        {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
          },
        }
      );

      if (!res.ok) throw new Error(`Weather proxy error: ${res.status}`);
      const json = await res.json();

      const current = json.weather.current;
      const { condition, label } = wmoToCondition(current.weather_code);
      const roadWarning = getRoadWarning(current.weather_code, current.wind_speed_10m);

      const hourly: HourlyForecast[] = (json.weather.hourly?.time || []).map((t: string, i: number) => {
        const date = new Date(t);
        const hCode = json.weather.hourly.weather_code?.[i] ?? 0;
        return {
          time: t,
          hour: date.getHours(),
          temp: Math.round(json.weather.hourly.temperature_2m?.[i] ?? 0),
          condition: wmoToCondition(hCode).condition,
          humidity: json.weather.hourly.relative_humidity_2m?.[i] ?? 0,
          windSpeed: Math.round(json.weather.hourly.wind_speed_10m?.[i] ?? 0),
          precipProb: json.weather.hourly.precipitation_probability?.[i] ?? 0,
        };
      });

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
        locationName: json.locationName || 'الموقع الحالي',
        lastUpdated: new Date(),
        isLoading: false,
        error: null,
        roadWarning,
      });
    } catch (err: any) {
      console.error('Weather fetch error:', err);
      setData(prev => ({ ...prev, isLoading: false, error: err.message }));
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  // Initial load + interval
  useEffect(() => {
    let cancelled = false;

    const startWeather = (lat: number, lng: number) => {
      if (cancelled) return;
      fetchWeather(lat, lng);
      intervalRef.current = setInterval(() => fetchWeather(lat, lng), refreshIntervalMs);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => startWeather(pos.coords.latitude, pos.coords.longitude),
        () => startWeather(DEFAULT_LAT, DEFAULT_LNG),
        { timeout: 5000, enableHighAccuracy: false }
      );
    } else {
      startWeather(DEFAULT_LAT, DEFAULT_LNG);
    }

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchWeather, refreshIntervalMs]);

  const refreshFromGPS = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    setData(prev => ({ ...prev, isLoading: true }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        fetchWeather(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setIsLocating(false);
        fetchWeather(DEFAULT_LAT, DEFAULT_LNG);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [fetchWeather]);

  return { ...data, refreshFromGPS, isLocating };
}
