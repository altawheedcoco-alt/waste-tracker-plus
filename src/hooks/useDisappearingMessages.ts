import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type DisappearDuration = 'off' | '5m' | '1h' | '24h' | '7d';

const DURATION_MAP: Record<DisappearDuration, number | null> = {
  'off': null,
  '5m': 5 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

const DURATION_LABELS: Record<DisappearDuration, string> = {
  'off': 'إيقاف',
  '5m': '5 دقائق',
  '1h': 'ساعة واحدة',
  '24h': '24 ساعة',
  '7d': '7 أيام',
};

export function useDisappearingMessages(partnerId?: string) {
  const { organization } = useAuth();
  const [duration, setDuration] = useState<DisappearDuration>('off');

  // Load saved setting
  useEffect(() => {
    if (!organization?.id || !partnerId) return;
    const key = `disappear_${organization.id}_${partnerId}`;
    const saved = localStorage.getItem(key) as DisappearDuration | null;
    if (saved) setDuration(saved);
  }, [organization?.id, partnerId]);

  const setDisappearDuration = useCallback((newDuration: DisappearDuration) => {
    if (!organization?.id || !partnerId) return;
    setDuration(newDuration);
    const key = `disappear_${organization.id}_${partnerId}`;
    localStorage.setItem(key, newDuration);
    
    if (newDuration === 'off') {
      toast.success('تم إيقاف الرسائل المؤقتة');
    } else {
      toast.success(`الرسائل ستختفي بعد ${DURATION_LABELS[newDuration]}`);
    }
  }, [organization?.id, partnerId]);

  const getExpiryDate = useCallback((): string | null => {
    const ms = DURATION_MAP[duration];
    if (!ms) return null;
    return new Date(Date.now() + ms).toISOString();
  }, [duration]);

  // Clean up expired messages periodically
  useEffect(() => {
    if (!organization?.id || !partnerId) return;
    
    const cleanup = async () => {
      await supabase
        .from('direct_messages')
        .update({ content: '⏳ رسالة مؤقتة منتهية', message_type: 'system' })
        .lt('expires_at', new Date().toISOString())
        .not('expires_at', 'is', null)
        .or(`and(sender_organization_id.eq.${organization.id},receiver_organization_id.eq.${partnerId}),and(sender_organization_id.eq.${partnerId},receiver_organization_id.eq.${organization.id})`);
    };

    cleanup();
    const interval = setInterval(cleanup, 30000);
    return () => clearInterval(interval);
  }, [organization?.id, partnerId]);

  return {
    duration,
    setDisappearDuration,
    getExpiryDate,
    durationLabels: DURATION_LABELS,
    isActive: duration !== 'off',
  };
}
