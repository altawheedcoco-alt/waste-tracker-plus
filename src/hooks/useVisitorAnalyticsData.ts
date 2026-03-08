import { useMemo } from 'react';

export interface VisitorRecord {
  id: string;
  country: string | null;
  city: string | null;
  region: string | null;
  browser: string | null;
  os: string | null;
  device_type: string | null;
  is_returning: boolean;
  created_at: string;
  session_duration_seconds: number;
  max_scroll_depth: number;
  pages_visited: string[];
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  bounce: boolean;
  ip_address: string | null;
  screen_resolution: string | null;
  language: string | null;
  referrer: string | null;
  visit_count: number;
  viewport_width: number | null;
  viewport_height: number | null;
  page_url: string | null;
  latitude: number | null;
  longitude: number | null;
  exit_page: string | null;
}

export interface AnalyticsData {
  countries: [string, number][];
  cities: [string, number][];
  regions: [string, number][];
  browsers: [string, number][];
  devices: [string, number][];
  oses: [string, number][];
  utmSources: [string, number][];
  utmMediums: [string, number][];
  utmCampaigns: [string, number][];
  topPages: [string, number][];
  exitPages: [string, number][];
  referrers: [string, number][];
  languages: [string, number][];
  screenResolutions: [string, number][];
  hourlyDistribution: number[];
  dailyDistribution: number[];
  weeklyTrend: { date: string; count: number }[];
  returningRate: number;
  bounceRate: number;
  avgDuration: number;
  avgScroll: number;
  avgPagesPerSession: number;
  todayVisits: number;
  thisWeekVisits: number;
  total: number;
  newVsReturning: { new: number; returning: number };
  deviceBounceRates: Record<string, { bounced: number; total: number }>;
  browserDurations: Record<string, { total: number; count: number }>;
  scrollDepthBuckets: { label: string; count: number }[];
  durationBuckets: { label: string; count: number }[];
}

const toEntries = (map: Record<string, number>, limit = 15): [string, number][] =>
  Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, limit);

const increment = (map: Record<string, number>, key: string | null) => {
  if (key) map[key] = (map[key] || 0) + 1;
};

export function useVisitorAnalyticsData(visitors: VisitorRecord[]): AnalyticsData {
  return useMemo(() => {
    const countries: Record<string, number> = {};
    const cities: Record<string, number> = {};
    const regions: Record<string, number> = {};
    const browsers: Record<string, number> = {};
    const devices: Record<string, number> = {};
    const oses: Record<string, number> = {};
    const utmSources: Record<string, number> = {};
    const utmMediums: Record<string, number> = {};
    const utmCampaigns: Record<string, number> = {};
    const topPages: Record<string, number> = {};
    const exitPages: Record<string, number> = {};
    const referrers: Record<string, number> = {};
    const languages: Record<string, number> = {};
    const screenResolutions: Record<string, number> = {};
    const hourlyDistribution = new Array(24).fill(0);
    const dailyDistribution = new Array(7).fill(0); // 0=Sun
    const weeklyMap: Record<string, number> = {};

    let returning = 0;
    let today = 0;
    let thisWeek = 0;
    let totalDuration = 0;
    let durationCount = 0;
    let totalScroll = 0;
    let scrollCount = 0;
    let bounceCount = 0;
    let totalPagesPerSession = 0;
    let pagesSessionCount = 0;

    const deviceBounceRates: Record<string, { bounced: number; total: number }> = {};
    const browserDurations: Record<string, { total: number; count: number }> = {};

    const scrollBuckets = { '0-25%': 0, '25-50%': 0, '50-75%': 0, '75-100%': 0 };
    const durationBuckets = { '< 10 ثانية': 0, '10-30 ثانية': 0, '30-60 ثانية': 0, '1-3 دقائق': 0, '3-5 دقائق': 0, '5+ دقائق': 0 };

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    visitors.forEach((v) => {
      increment(countries, v.country);
      increment(cities, v.city);
      increment(regions, v.region);
      increment(browsers, v.browser);
      increment(devices, v.device_type);
      increment(oses, v.os);
      increment(utmSources, v.utm_source);
      increment(utmMediums, v.utm_medium);
      increment(utmCampaigns, v.utm_campaign);
      increment(languages, v.language);
      increment(screenResolutions, v.screen_resolution);
      increment(exitPages, v.exit_page);

      if (v.referrer) {
        try {
          const host = new URL(v.referrer).hostname;
          referrers[host] = (referrers[host] || 0) + 1;
        } catch {
          increment(referrers, v.referrer);
        }
      }

      if (v.pages_visited && Array.isArray(v.pages_visited)) {
        v.pages_visited.forEach((p) => { topPages[p] = (topPages[p] || 0) + 1; });
        totalPagesPerSession += v.pages_visited.length;
        pagesSessionCount++;
      }

      if (v.is_returning) returning++;
      if (v.bounce) bounceCount++;

      // Time analysis
      if (v.created_at) {
        const d = new Date(v.created_at);
        hourlyDistribution[d.getHours()]++;
        dailyDistribution[d.getDay()]++;
        const dateKey = v.created_at.slice(0, 10);
        weeklyMap[dateKey] = (weeklyMap[dateKey] || 0) + 1;
        if (dateKey === todayStr) today++;
        if (d >= weekAgo) thisWeek++;
      }

      // Duration
      if (v.session_duration_seconds > 0) {
        totalDuration += v.session_duration_seconds;
        durationCount++;
        const s = v.session_duration_seconds;
        if (s < 10) durationBuckets['< 10 ثانية']++;
        else if (s < 30) durationBuckets['10-30 ثانية']++;
        else if (s < 60) durationBuckets['30-60 ثانية']++;
        else if (s < 180) durationBuckets['1-3 دقائق']++;
        else if (s < 300) durationBuckets['3-5 دقائق']++;
        else durationBuckets['5+ دقائق']++;

        if (v.browser) {
          if (!browserDurations[v.browser]) browserDurations[v.browser] = { total: 0, count: 0 };
          browserDurations[v.browser].total += s;
          browserDurations[v.browser].count++;
        }
      }

      // Scroll
      if (v.max_scroll_depth > 0) {
        totalScroll += v.max_scroll_depth;
        scrollCount++;
        const sd = v.max_scroll_depth;
        if (sd <= 25) scrollBuckets['0-25%']++;
        else if (sd <= 50) scrollBuckets['25-50%']++;
        else if (sd <= 75) scrollBuckets['50-75%']++;
        else scrollBuckets['75-100%']++;
      }

      // Device bounce
      if (v.device_type) {
        if (!deviceBounceRates[v.device_type]) deviceBounceRates[v.device_type] = { bounced: 0, total: 0 };
        deviceBounceRates[v.device_type].total++;
        if (v.bounce) deviceBounceRates[v.device_type].bounced++;
      }
    });

    // Build weekly trend (last 14 days)
    const weeklyTrend: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      weeklyTrend.push({ date: key, count: weeklyMap[key] || 0 });
    }

    return {
      countries: toEntries(countries),
      cities: toEntries(cities, 20),
      regions: toEntries(regions),
      browsers: toEntries(browsers),
      devices: toEntries(devices),
      oses: toEntries(oses),
      utmSources: toEntries(utmSources),
      utmMediums: toEntries(utmMediums),
      utmCampaigns: toEntries(utmCampaigns),
      topPages: toEntries(topPages, 20),
      exitPages: toEntries(exitPages, 10),
      referrers: toEntries(referrers),
      languages: toEntries(languages),
      screenResolutions: toEntries(screenResolutions),
      hourlyDistribution,
      dailyDistribution,
      weeklyTrend,
      returningRate: visitors.length ? Math.round((returning / visitors.length) * 100) : 0,
      bounceRate: visitors.length ? Math.round((bounceCount / visitors.length) * 100) : 0,
      avgDuration: durationCount ? Math.round(totalDuration / durationCount) : 0,
      avgScroll: scrollCount ? Math.round(totalScroll / scrollCount) : 0,
      avgPagesPerSession: pagesSessionCount ? Math.round((totalPagesPerSession / pagesSessionCount) * 10) / 10 : 0,
      todayVisits: today,
      thisWeekVisits: thisWeek,
      total: visitors.length,
      newVsReturning: { new: visitors.length - returning, returning },
      deviceBounceRates,
      browserDurations,
      scrollDepthBuckets: Object.entries(scrollBuckets).map(([label, count]) => ({ label, count })),
      durationBuckets: Object.entries(durationBuckets).map(([label, count]) => ({ label, count })),
    };
  }, [visitors]);
}

export const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds} ثانية`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins} د ${secs} ث` : `${mins} دقيقة`;
};
