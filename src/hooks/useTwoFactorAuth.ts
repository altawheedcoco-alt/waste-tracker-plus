import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TwoFactorStatus {
  enabled: boolean;
  verifiedAt?: string;
  lastUsedAt?: string;
}

interface SetupData {
  secret: string;
  backupCodes: string[];
  otpauthUrl: string;
}

export const useTwoFactorAuth = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [setupData, setSetupData] = useState<SetupData | null>(null);

  const callTwoFactorApi = async (action: string, data: Record<string, any> = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('يجب تسجيل الدخول أولاً');
    }

    const response = await supabase.functions.invoke('two-factor-auth', {
      body: { action, ...data }
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    if (!response.data.success) {
      throw new Error(response.data.error || 'حدث خطأ غير متوقع');
    }

    return response.data;
  };

  const checkStatus = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callTwoFactorApi('status');
      setStatus({
        enabled: data.enabled,
        verifiedAt: data.verifiedAt,
        lastUsedAt: data.lastUsedAt
      });
      return data.enabled;
    } catch (error: any) {
      console.error('Error checking 2FA status:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const startSetup = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callTwoFactorApi('setup');
      setSetupData({
        secret: data.secret,
        backupCodes: data.backupCodes,
        otpauthUrl: data.otpauthUrl
      });
      return data;
    } catch (error: any) {
      toast.error(error.message || 'فشل في بدء إعداد المصادقة الثنائية');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifySetup = useCallback(async (code: string) => {
    setLoading(true);
    try {
      await callTwoFactorApi('verify-setup', { code });
      toast.success('تم تفعيل المصادقة الثنائية بنجاح');
      setStatus({ enabled: true, verifiedAt: new Date().toISOString() });
      setSetupData(null);
      return true;
    } catch (error: any) {
      toast.error(error.message || 'رمز التحقق غير صحيح');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const verify = useCallback(async (code?: string, backupCode?: string) => {
    setLoading(true);
    try {
      await callTwoFactorApi('verify', { code, backupCode });
      return true;
    } catch (error: any) {
      toast.error(error.message || 'رمز التحقق غير صحيح');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const disable = useCallback(async (code: string) => {
    setLoading(true);
    try {
      await callTwoFactorApi('disable', { code });
      toast.success('تم إلغاء المصادقة الثنائية');
      setStatus({ enabled: false });
      return true;
    } catch (error: any) {
      toast.error(error.message || 'فشل في إلغاء المصادقة الثنائية');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const regenerateBackupCodes = useCallback(async (code: string) => {
    setLoading(true);
    try {
      const data = await callTwoFactorApi('regenerate-backup-codes', { code });
      toast.success('تم إنشاء أكواد استرداد جديدة');
      return data.backupCodes as string[];
    } catch (error: any) {
      toast.error(error.message || 'فشل في إنشاء أكواد جديدة');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelSetup = useCallback(() => {
    setSetupData(null);
  }, []);

  return {
    loading,
    status,
    setupData,
    checkStatus,
    startSetup,
    verifySetup,
    verify,
    disable,
    regenerateBackupCodes,
    cancelSetup
  };
};
