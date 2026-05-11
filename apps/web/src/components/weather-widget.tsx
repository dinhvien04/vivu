'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from './icon';

interface WeatherWidgetProps {
  lat: number;
  lng: number;
}

interface CurrentWeather {
  temperature: number;
  weatherCode: number;
}

interface DailyForecast {
  date: string;
  tempMin: number;
  tempMax: number;
  weatherCode: number;
}

interface WeatherData {
  current: CurrentWeather;
  daily: DailyForecast[];
}

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
  };
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    weather_code?: number[];
  };
}

// https://open-meteo.com/en/docs#weathervariables
function weatherCodeToIcon(code: number): { icon: string; tone: string } {
  if (code === 0) return { icon: 'wb_sunny', tone: 'text-amber-500' };
  if (code <= 2) return { icon: 'partly_cloudy_day', tone: 'text-amber-400' };
  if (code === 3) return { icon: 'cloud', tone: 'text-slate-400' };
  if (code === 45 || code === 48) return { icon: 'foggy', tone: 'text-slate-300' };
  if (code >= 51 && code <= 57) return { icon: 'rainy_light', tone: 'text-sky-400' };
  if (code >= 61 && code <= 67) return { icon: 'rainy', tone: 'text-sky-500' };
  if (code >= 71 && code <= 77) return { icon: 'weather_snowy', tone: 'text-sky-200' };
  if (code >= 80 && code <= 82) return { icon: 'rainy_heavy', tone: 'text-sky-600' };
  if (code >= 95) return { icon: 'thunderstorm', tone: 'text-indigo-500' };
  return { icon: 'cloud', tone: 'text-slate-400' };
}

function formatDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'vi-VN', {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function WeatherWidget({ lat, lng }: WeatherWidgetProps) {
  const t = useTranslations('place');
  const [locale, setLocale] = useState('vi');
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLocale(document.documentElement.lang || 'vi');
    let cancelled = false;
    setLoading(true);
    setError(null);

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,weather_code` +
      `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
      `&timezone=Asia%2FBangkok&forecast_days=3`;

    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((json: OpenMeteoResponse) => {
        if (cancelled) return;
        if (
          typeof json.current?.temperature_2m !== 'number' ||
          typeof json.current?.weather_code !== 'number' ||
          !Array.isArray(json.daily?.time) ||
          !Array.isArray(json.daily?.temperature_2m_max) ||
          !Array.isArray(json.daily?.temperature_2m_min) ||
          !Array.isArray(json.daily?.weather_code)
        ) {
          throw new Error('invalid response');
        }
        const daily: DailyForecast[] = json.daily.time
          .map((time, i): DailyForecast | null => {
            const tempMin = json.daily!.temperature_2m_min![i];
            const tempMax = json.daily!.temperature_2m_max![i];
            const weatherCode = json.daily!.weather_code![i];
            if (
              typeof tempMin !== 'number' ||
              typeof tempMax !== 'number' ||
              typeof weatherCode !== 'number'
            ) {
              return null;
            }
            return { date: time, tempMin, tempMax, weatherCode };
          })
          .filter((d): d is DailyForecast => d !== null);
        setData({
          current: {
            temperature: json.current.temperature_2m,
            weatherCode: json.current.weather_code,
          },
          daily,
        });
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'unknown');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-h4 text-h4 text-on-surface">{t('weatherTitle')}</h3>
        <Icon name="thermostat" className="text-primary" />
      </div>

      {loading && (
        <div className="space-y-3" aria-busy="true">
          <div className="h-12 animate-pulse rounded-lg bg-surface-container" />
          <div className="h-20 animate-pulse rounded-lg bg-surface-container" />
        </div>
      )}

      {!loading && error && (
        <p className="text-body-sm text-on-surface-variant">{t('weatherError')}</p>
      )}

      {!loading && !error && data && (
        <>
          <div className="flex items-center gap-3">
            {(() => {
              const m = weatherCodeToIcon(data.current.weatherCode);
              return <Icon name={m.icon} className={`!text-4xl ${m.tone}`} />;
            })()}
            <div>
              <p className="font-h2 text-h2 leading-none text-on-surface">
                {Math.round(data.current.temperature)}°C
              </p>
              <p className="text-body-sm text-on-surface-variant">{t('weatherNow')}</p>
            </div>
          </div>

          <ul className="mt-4 grid grid-cols-3 gap-2 text-center">
            {data.daily.map((d) => {
              const m = weatherCodeToIcon(d.weatherCode);
              return (
                <li
                  key={d.date}
                  className="rounded-lg border border-outline-variant/40 bg-surface px-2 py-3"
                >
                  <p className="text-body-sm text-on-surface-variant">
                    {formatDate(d.date, locale)}
                  </p>
                  <Icon name={m.icon} className={`!text-2xl ${m.tone}`} />
                  <p className="text-body-sm font-semibold text-on-surface">
                    {Math.round(d.tempMin)}° / {Math.round(d.tempMax)}°
                  </p>
                </li>
              );
            })}
          </ul>

          <p className="mt-3 text-overline tracking-overline text-on-surface-variant">
            {t('weatherSource')}{' '}
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              Open-Meteo
            </a>
          </p>
        </>
      )}
    </div>
  );
}
