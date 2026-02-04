import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ApiScope = 
  | 'shipments:read' 
  | 'shipments:write' 
  | 'accounts:read' 
  | 'accounts:write' 
  | 'reports:read' 
  | 'organizations:read' 
  | 'all';

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: ApiScope[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  rate_limit_per_minute: number;
  created_at: string;
}

export interface ApiRequestLog {
  id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  created_at: string;
  error_message: string | null;
}

// Generate a secure API key
function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'irec_';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// Hash API key using Web Crypto API
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function useApiKeys() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['api-keys', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, name, key_prefix, scopes, is_active, last_used_at, expires_at, rate_limit_per_minute, created_at')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ApiKey[];
    },
    enabled: !!profile?.organization_id,
  });

  const createApiKey = useMutation({
    mutationFn: async ({ 
      name, 
      scopes, 
      expiresAt, 
      rateLimit 
    }: { 
      name: string; 
      scopes: ApiScope[]; 
      expiresAt?: string; 
      rateLimit?: number;
    }) => {
      if (!profile?.organization_id || !profile?.id) {
        throw new Error('Organization not found');
      }

      const apiKey = generateApiKey();
      const keyHash = await hashApiKey(apiKey);
      const keyPrefix = apiKey.substring(0, 10) + '...';

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          organization_id: profile.organization_id,
          name,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          scopes,
          expires_at: expiresAt || null,
          rate_limit_per_minute: rateLimit || 60,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Return the full key only once - it won't be stored
      return { ...data, fullKey: apiKey };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('تم إنشاء مفتاح API بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في إنشاء مفتاح API: ' + error.message);
    },
  });

  const updateApiKey = useMutation({
    mutationFn: async ({ 
      id, 
      name, 
      isActive, 
      scopes,
      rateLimit 
    }: { 
      id: string; 
      name?: string; 
      isActive?: boolean;
      scopes?: ApiScope[];
      rateLimit?: number;
    }) => {
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (isActive !== undefined) updates.is_active = isActive;
      if (scopes !== undefined) updates.scopes = scopes;
      if (rateLimit !== undefined) updates.rate_limit_per_minute = rateLimit;

      const { error } = await supabase
        .from('api_keys')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('تم تحديث مفتاح API');
    },
    onError: (error) => {
      toast.error('فشل في تحديث مفتاح API: ' + error.message);
    },
  });

  const deleteApiKey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('تم حذف مفتاح API');
    },
    onError: (error) => {
      toast.error('فشل في حذف مفتاح API: ' + error.message);
    },
  });

  return {
    apiKeys,
    isLoading,
    createApiKey,
    updateApiKey,
    deleteApiKey,
  };
}

export function useApiRequestLogs(apiKeyId?: string) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['api-request-logs', apiKeyId],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      let query = supabase
        .from('api_request_logs')
        .select('id, endpoint, method, status_code, response_time_ms, created_at, error_message')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (apiKeyId) {
        query = query.eq('api_key_id', apiKeyId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as ApiRequestLog[];
    },
    enabled: !!profile?.organization_id,
  });
}
