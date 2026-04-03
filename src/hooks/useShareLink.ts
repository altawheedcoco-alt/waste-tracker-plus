import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';

function generateCode(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => chars[b % chars.length]).join('');
}

interface CreateShareLinkParams {
  resourceType: string;
  resourceId: string;
  visibilityLevel?: 'public' | 'authenticated' | 'linked_only';
  title?: string;
  description?: string;
  requiresPin?: boolean;
  pin?: string;
  expiresAt?: string;
  maxViews?: number;
  allowedFields?: string[];
}

export function useShareLink() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const createShareLink = async (params: CreateShareLinkParams) => {
    if (!profile) {
      toast.error('يجب تسجيل الدخول أولاً');
      return null;
    }

    setLoading(true);
    try {
      const code = generateCode();

      // Create the link WITHOUT pin first (pin will be hashed server-side)
      const { data, error } = await supabase
        .from('shared_links')
        .insert({
          code,
          resource_type: params.resourceType,
          resource_id: params.resourceId,
          created_by: profile.id,
          organization_id: profile.organization_id,
          visibility_level: params.visibilityLevel || 'public',
          title: params.title,
          description: params.description,
          requires_pin: false, // Will be set to true after hashing
          pin_hash: null,
          expires_at: params.expiresAt || null,
          max_views: params.maxViews || null,
          allowed_fields: params.allowedFields || [],
        })
        .select()
        .single();

      if (error) throw error;

      // If PIN is provided, hash it server-side via edge function
      if (params.requiresPin && params.pin) {
        const { error: hashError } = await supabase.functions.invoke(
          'hash-share-pin',
          { body: { pin: params.pin, link_id: data.id } }
        );
        if (hashError) {
          console.error('PIN hashing failed:', hashError);
          toast.error('فشل تشفير الرقم السري');
          // Link is created but without PIN — user can retry
        }
      }

      const shareUrl = `${window.location.origin}/s/${params.resourceType}/${code}`;
      return { ...data, shareUrl };
    } catch (err: any) {
      toast.error('فشل إنشاء رابط المشاركة');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deactivateLink = async (linkId: string) => {
    const { error } = await supabase
      .from('shared_links')
      .update({ is_active: false })
      .eq('id', linkId);

    if (error) {
      toast.error('فشل تعطيل الرابط');
    } else {
      toast.success('تم تعطيل الرابط');
    }
  };

  const getMyLinks = async (resourceType?: string, resourceId?: string) => {
    let query = supabase
      .from('shared_links')
      .select('*')
      .eq('created_by', profile?.id)
      .order('created_at', { ascending: false });

    if (resourceType) query = query.eq('resource_type', resourceType);
    if (resourceId) query = query.eq('resource_id', resourceId);

    const { data, error } = await query;
    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  };

  const getAccessLog = async (linkId: string) => {
    const { data, error } = await supabase
      .from('shared_link_access_attempts')
      .select('*')
      .eq('shared_link_id', linkId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  };

  return { createShareLink, deactivateLink, getMyLinks, getAccessLog, loading };
}
