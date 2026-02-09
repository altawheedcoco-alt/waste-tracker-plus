import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserPin {
  id: string;
  user_id: string;
  is_active: boolean;
  failed_attempts: number;
  locked_until: string | null;
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'pin_salt_v2');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const computed = await hashPin(pin);
  return computed === hash;
}

const PIN_VERIFIED_KEY = 'pin_verified_session';
const MAX_ATTEMPTS = 6;

export function useUserPin() {
  const { toast } = useToast();
  const [pinData, setPinData] = useState<UserPin | null>(null);
  const [loading, setLoading] = useState(true);
  const [pinVerified, setPinVerified] = useState(() => sessionStorage.getItem(PIN_VERIFIED_KEY) === 'true');

  const fetchPin = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('user_pin_codes')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setPinData(data);
    } catch (err) {
      console.error('Error fetching pin:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPin(); }, [fetchPin]);

  const setupPin = async (pin: string, recoveryConfig: Record<string, { enabled: boolean; data: Record<string, any> }>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const hash = await hashPin(pin);
      const { data: pinRecord, error } = await supabase
        .from('user_pin_codes')
        .insert({ user_id: user.id, pin_hash: hash })
        .select()
        .single();

      if (error) throw error;

      // Insert recovery methods
      const recoveryInserts = Object.entries(recoveryConfig).map(([type, config]) => ({
        user_pin_id: pinRecord.id,
        recovery_type: type,
        recovery_data: config.data,
        is_enabled: config.enabled,
      }));
      if (recoveryInserts.length > 0) {
        await supabase.from('pin_recovery_methods').insert(recoveryInserts);
      }

      // Generate backup codes
      if (recoveryConfig.backup_code?.enabled) {
        const codes = Array.from({ length: 8 }, () =>
          Math.random().toString(36).substring(2, 8).toUpperCase()
        );
        const codeInserts = await Promise.all(codes.map(async (code) => ({
          user_pin_id: pinRecord.id,
          code_hash: await hashPin(code),
        })));
        await supabase.from('pin_backup_codes').insert(codeInserts);
        toast({ title: 'رموز احتياطية', description: `احفظ هذه الرموز: ${codes.join(' - ')}` });
      }

      toast({ title: 'تم بنجاح', description: 'تم تفعيل رمز التعريف الشخصي' });
      fetchPin();
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    }
  };

  const verifyUserPin = async (pin: string): Promise<{ success: boolean; attemptsLeft: number }> => {
    if (!pinData) return { success: false, attemptsLeft: 0 };

    try {
      // Check if locked
      if (pinData.locked_until && new Date(pinData.locked_until) > new Date()) {
        return { success: false, attemptsLeft: 0 };
      }

      const { data: fresh } = await supabase.from('user_pin_codes').select('*').eq('id', pinData.id).single();
      if (!fresh) return { success: false, attemptsLeft: 0 };

      const valid = await verifyPin(pin, fresh.pin_hash);

      if (valid) {
        await supabase.from('user_pin_codes').update({ failed_attempts: 0, locked_until: null }).eq('id', pinData.id);
        setPinVerified(true);
        sessionStorage.setItem(PIN_VERIFIED_KEY, 'true');
        return { success: true, attemptsLeft: MAX_ATTEMPTS };
      } else {
        const newAttempts = (fresh.failed_attempts || 0) + 1;
        const updateData: any = { failed_attempts: newAttempts };
        if (newAttempts >= MAX_ATTEMPTS) {
          updateData.locked_until = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // lock 30min
        }
        await supabase.from('user_pin_codes').update(updateData).eq('id', pinData.id);
        setPinData(prev => prev ? { ...prev, failed_attempts: newAttempts } : null);
        return { success: false, attemptsLeft: MAX_ATTEMPTS - newAttempts };
      }
    } catch {
      return { success: false, attemptsLeft: 0 };
    }
  };

  const removePin = async () => {
    if (!pinData) return;
    try {
      await supabase.from('user_pin_codes').delete().eq('id', pinData.id);
      setPinData(null);
      setPinVerified(true);
      sessionStorage.removeItem(PIN_VERIFIED_KEY);
      toast({ title: 'تم', description: 'تم إلغاء رمز التعريف' });
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    }
  };

  const markVerified = () => {
    setPinVerified(true);
    sessionStorage.setItem(PIN_VERIFIED_KEY, 'true');
  };

  const requiresPin = pinData?.is_active && !pinVerified;

  return { pinData, loading, setupPin, verifyUserPin, removePin, requiresPin, pinVerified, markVerified, fetchPin };
}
