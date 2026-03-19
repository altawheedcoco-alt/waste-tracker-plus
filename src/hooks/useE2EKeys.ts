import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { generateAndSaveKeyPair, hasLocalKeys, getDeviceId } from '@/lib/e2e';
import { useQuery } from '@tanstack/react-query';

/**
 * Manages E2E key pair lifecycle:
 * - Auto-generates keys on first login
 * - Publishes public key to server
 * - Private key stays in IndexedDB
 */
export function useE2EKeys() {
  const { user } = useAuth();

  // Ensure keys exist
  useEffect(() => {
    if (!user?.id) return;
    
    (async () => {
      const deviceId = getDeviceId();
      const hasKeys = await hasLocalKeys(user.id);
      
      if (!hasKeys) {
        const publicKey = await generateAndSaveKeyPair(user.id, deviceId);
        
        // Publish public key
        await supabase.from('e2e_key_pairs').upsert({
          user_id: user.id,
          public_key: publicKey,
          device_id: deviceId,
          key_type: 'ECDH-P256',
          is_active: true,
        }, { onConflict: 'user_id,device_id' });
      }
    })();
  }, [user?.id]);

  // Fetch a user's latest public key
  const getPublicKey = useCallback(async (userId: string): Promise<string | null> => {
    const { data } = await supabase
      .from('e2e_key_pairs')
      .select('public_key')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data?.public_key || null;
  }, []);

  // Fetch all active public keys to support old messages after key rotation/device changes
  const getPublicKeys = useCallback(async (userId: string): Promise<string[]> => {
    const { data } = await supabase
      .from('e2e_key_pairs')
      .select('public_key')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    return Array.from(new Set((data || []).map((item) => item.public_key).filter(Boolean)));
  }, []);

  return { getPublicKey, getPublicKeys };
}
