/**
 * Hook لجلب تقييمات السائق وحساب السمعة
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DriverRating {
  id: string;
  driver_id: string;
  shipment_id: string | null;
  overall_rating: number;
  punctuality_rating: number | null;
  safety_rating: number | null;
  communication_rating: number | null;
  professionalism_rating: number | null;
  comment: string | null;
  rating_direction: string;
  created_at: string;
}

export interface ReputationScore {
  avgOverall: number;
  avgPunctuality: number;
  avgSafety: number;
  avgCommunication: number;
  avgProfessionalism: number;
  totalRatings: number;
  reputationLevel: 'new' | 'rising' | 'trusted' | 'elite';
  reputationLabel: string;
}

function calcReputation(ratings: DriverRating[]): ReputationScore {
  const orgRatings = ratings.filter(r => r.rating_direction === 'org_to_driver');
  const count = orgRatings.length;

  const avg = (key: keyof DriverRating) => {
    const vals = orgRatings.map(r => r[key] as number | null).filter((v): v is number => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  const avgOverall = avg('overall_rating');
  let level: ReputationScore['reputationLevel'] = 'new';
  let label = '🆕 جديد';

  if (count >= 50 && avgOverall >= 4.5) { level = 'elite'; label = '🏆 نخبة'; }
  else if (count >= 20 && avgOverall >= 4.0) { level = 'trusted'; label = '✅ موثوق'; }
  else if (count >= 5) { level = 'rising'; label = '📈 صاعد'; }

  return {
    avgOverall: Math.round(avgOverall * 10) / 10,
    avgPunctuality: Math.round(avg('punctuality_rating') * 10) / 10,
    avgSafety: Math.round(avg('safety_rating') * 10) / 10,
    avgCommunication: Math.round(avg('communication_rating') * 10) / 10,
    avgProfessionalism: Math.round(avg('professionalism_rating') * 10) / 10,
    totalRatings: count,
    reputationLevel: level,
    reputationLabel: label,
  };
}

export function useDriverRatings(driverId: string | undefined) {
  const { data: ratings = [], isLoading } = useQuery({
    queryKey: ['driver-ratings', driverId],
    enabled: !!driverId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_ratings')
        .select('*')
        .eq('driver_id', driverId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as DriverRating[];
    },
  });

  const reputation = calcReputation(ratings);

  return { ratings, reputation, isLoading };
}
