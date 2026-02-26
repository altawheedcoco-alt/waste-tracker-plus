import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, ExternalLink, Megaphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { withTimeout, logNetworkError } from '@/lib/networkGuard';

const HomepageAds = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const { data: ads = [] } = useQuery({
    queryKey: ['homepage-featured-ads'],
    queryFn: async () => {
      try {
        const { data, error } = await withTimeout(
          'homepage-featured-ads',
          async () => {
            return await supabase
              .from('advertisements')
              .select('*, ad_plans(*)')
              .eq('status', 'active')
              .eq('is_featured', true)
              .order('created_at', { ascending: false })
              .limit(10);
          }
        );

        if (error) throw error;
        return data || [];
      } catch (error) {
        logNetworkError('homepage-featured-ads', error);
        return [];
      }
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
  });

  const trackClick = useCallback(async (ad: any) => {
    try {
      await Promise.allSettled([
        supabase.from('ad_analytics').insert({ advertisement_id: ad.id, event_type: 'click', page_location: 'homepage' }),
        supabase.from('advertisements').update({ clicks_count: (ad.clicks_count || 0) + 1 }).eq('id', ad.id),
      ]);
    } catch (error) {
      logNetworkError('ad-click-tracking', error);
    }

    if (ad.external_link) window.open(ad.external_link, '_blank');
    else if (ad.cta_link) navigate(ad.cta_link);
  }, [navigate]);

  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => setCurrent(c => (c + 1) % ads.length), 6000);
    return () => clearInterval(timer);
  }, [ads.length]);

  // Track impression (debounced)
  useEffect(() => {
    if (!ads[current]) return;
    const timer = setTimeout(async () => {
      try {
        await Promise.allSettled([
          supabase.from('ad_analytics').insert({ advertisement_id: ads[current].id, event_type: 'impression', page_location: 'homepage' }),
          supabase.from('advertisements').update({ impressions_count: (ads[current].impressions_count || 0) + 1 }).eq('id', ads[current].id),
        ]);
      } catch (error) {
        logNetworkError('ad-impression-tracking', error);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [current, ads]);

  if (ads.length === 0) return null;

  const ad = ads[current];

  return (
    <section className="py-8 bg-gradient-to-b from-muted/30 to-background">
      <div className="container px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">إعلانات مميزة</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/ad-plans')} className="text-xs">
            أعلن معنا
          </Button>
        </div>

        <div className="relative">
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-l from-primary/5 to-transparent">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row items-center gap-4 p-6">
                {ad.media_urls?.length > 0 && (
                  <div className="w-full md:w-1/3 shrink-0">
                    <img
                      src={ad.media_urls[0]}
                      alt={ad.title}
                      className="w-full h-40 md:h-48 object-cover rounded-lg"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="flex-1 text-right space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {ad.badge_text && <Badge className="bg-amber-500 text-white">{ad.badge_text}</Badge>}
                    <Badge variant="outline" className="text-[10px]">إعلان</Badge>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold">{ad.title}</h3>
                  {ad.subtitle && <p className="text-muted-foreground">{ad.subtitle}</p>}
                  {ad.description && <p className="text-sm line-clamp-2">{ad.description}</p>}
                  <div className="flex items-center gap-3 pt-2">
                    <Button onClick={() => trackClick(ad)} className="gap-2">
                      {ad.cta_text || 'تعرف أكثر'}
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {ads.length > 1 && (
            <>
              <button className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/80 shadow hover:bg-background" onClick={() => setCurrent(c => (c + 1) % ads.length)}>
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/80 shadow hover:bg-background" onClick={() => setCurrent(c => (c - 1 + ads.length) % ads.length)}>
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {ads.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {ads.map((_, i) => (
                <button key={i} className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-primary w-6' : 'bg-muted-foreground/30'}`} onClick={() => setCurrent(i)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HomepageAds;
