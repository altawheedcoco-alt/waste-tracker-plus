import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CopilotResponse {
  reply: string;
  isLoading: boolean;
}

export function useChatCopilot() {
  const { user, organization } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const askCopilot = useCallback(async (
    command: string,
    recentMessages?: { content: string; isOwn: boolean; senderName: string }[]
  ): Promise<string | null> => {
    if (!user) return null;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-copilot', {
        body: {
          command,
          context: { recentMessages: recentMessages?.slice(-20) },
          userId: user.id,
          organizationId: organization?.id,
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return null;
      }
      return data?.reply || null;
    } catch (err: any) {
      console.error('Copilot error:', err);
      toast.error('فشل الاتصال بالمساعد الذكي');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, organization]);

  return { askCopilot, isLoading };
}
